/**
 * A PowerPoint file, opened as a design.
 *
 * This is the mirror of `export/exportPptx.ts`, and it is deliberately the same
 * kind of thing: a translation between two models that agree about most of a
 * slide and disagree about the rest. What comes across is position, size,
 * rotation, words and their formatting, fills, outlines, pictures and tables.
 * What does not is everything PowerPoint can do that a design has no way to
 * hold — charts, SmartArt, embedded video, 3-D effects, and the long tail of
 * preset geometries. Those are counted in the report rather than approximated,
 * because a chart silently imported as a grey box is worse than a chart the
 * import tells you it left behind.
 *
 * The whole point of landing on real widgets rather than a picture per slide is
 * the brand kit. `applyBrandToLayouts` repaints a design by walking the colours
 * it can see — a text box's `color`, a shape's `color`, a `w-svg`'s `colors`, a
 * page's `backgroundColor` — so a deck imported as pictures could never be
 * rebranded, and one imported as widgets can be rebranded in one click.
 *
 * ## What the caller does
 *
 * Nothing here unzips anything or fetches anything: this file is part of the
 * compose entry, which runs on a server and in a browser and is allowed to do
 * neither. The caller opens the zip, hands over the XML parts as text, uploads
 * the media wherever media lives for them, and hands over a map of what each
 * one became. A picture with no entry in that map is left out and reported,
 * exactly as an unresolved `imageRef` composes as a slide with no picture.
 */
import { SLIDE_PAGE, type DesignDocument, type ImageRef, type TdLayout } from '../types'
import { imageWidget, page, textWidget, uuid } from '../widgets'
import { colorInside, emuToPx, fontChoice, nearestFont, percentOf, readColorMap, readTheme, sixtiethsToDegrees, toDesignColor, type ColorMap, type ColorScheme } from './style'
import { readTextBody, type ImportedText } from './text'
import { attr, child, children, find, num, parseXml, path, type XNode } from './xml'

/** The XML parts of the package, by their path inside the zip. */
export type PptxParts = Map<string, string>

/** What each `ppt/media/...` entry became once the caller had hosted it. */
export type PptxMedia = Map<string, ImageRef>

export type PptxImportOptions = {
  media?: PptxMedia
  /** Overrides the name taken from the file. */
  title?: string
}

/** One thing the import could not bring across, and why. */
export type PptxSkip = { slide: number; what: string; reason: string }

export type PptxImportReport = {
  slides: number
  widgets: number
  /** Shapes left behind, so the caller can say so rather than the user finding out. */
  skipped: PptxSkip[]
  /** Substitutions made, deduplicated: `Calibri` became `Inter`. */
  fonts: Array<{ from: string; to: string }>
}

export type PptxImportResult = { document: DesignDocument; report: PptxImportReport }

/** Where the media a caller has to host lives inside the package. */
export const PPTX_MEDIA_PREFIX = 'ppt/media/'

/**
 * A deck bigger than this is refused rather than imported.
 *
 * The planner's own schema caps a design at 60 pages, and a 200-slide deck is
 * not something anybody is going to rebrand and re-present — it is a export of
 * a year of assemblies. Failing at the door with a number in the message beats
 * spending a minute building a document that validation then rejects.
 */
export const MAX_PPTX_SLIDES = 60

/** Shapes smaller than this in either axis are decoration nobody can select. */
const MIN_SHAPE_PX = 2

/** Preset geometries that map onto a widget the editor actually has. */
const RECT_GEOMS = new Set(['rect', 'roundRect', 'snip1Rect', 'snip2SameRect', 'round1Rect', 'round2SameRect', 'plaque'])
const ELLIPSE_GEOMS = new Set(['ellipse', 'circle'])

/**
 * A coordinate transform, in design pixels.
 *
 * Groups nest, and a shape inside one is positioned in its group's own
 * coordinate space rather than the slide's. Rather than build a widget tree —
 * which would mean a `w-group` per group and a parent chain to keep consistent
 * — each group's mapping is folded into this and the shapes inside it come out
 * flat, already in slide coordinates. The arrangement looks identical and every
 * shape stays individually selectable, which is what somebody rebranding a deck
 * wants; what is lost is the grouping itself, which they can redo in a drag.
 */
type Transform = { tx: number; ty: number; sx: number; sy: number }

const IDENTITY = (scale: number): Transform => ({ tx: 0, ty: 0, sx: scale, sy: scale })

function place(transform: Transform, emu: { x: number; y: number; cx: number; cy: number }) {
  return {
    left: transform.tx + emuToPx(emu.x) * transform.sx,
    top: transform.ty + emuToPx(emu.y) * transform.sy,
    width: emuToPx(emu.cx) * transform.sx,
    height: emuToPx(emu.cy) * transform.sy,
  }
}

/** `<a:xfrm>` read into EMU, or null when the shape has no explicit geometry. */
function readXfrm(spPr: XNode | null): { x: number; y: number; cx: number; cy: number; rot: number; flipH: boolean; flipV: boolean } | null {
  const xfrm = child(spPr, 'xfrm')
  if (!xfrm) return null
  const off = child(xfrm, 'off')
  const ext = child(xfrm, 'ext')
  if (!off || !ext) return null
  return {
    x: num(off, 'x'),
    y: num(off, 'y'),
    cx: num(ext, 'cx'),
    cy: num(ext, 'cy'),
    rot: sixtiethsToDegrees(num(xfrm, 'rot')),
    flipH: attr(xfrm, 'flipH') === '1',
    flipV: attr(xfrm, 'flipV') === '1',
  }
}

// ---- package plumbing --------------------------------------------------------

/** `ppt/slides/../theme/theme1.xml` collapsed to `ppt/theme/theme1.xml`. */
function resolvePath(base: string, target: string): string {
  if (target.startsWith('/')) return target.slice(1)
  const parts = base.split('/').filter(Boolean)
  for (const segment of target.split('/')) {
    if (segment === '' || segment === '.') continue
    if (segment === '..') parts.pop()
    else parts.push(segment)
  }
  return parts.join('/')
}

/** The `_rels` part that belongs to a part. */
function relsPathFor(part: string): string {
  const cut = part.lastIndexOf('/')
  return `${part.slice(0, cut)}/_rels/${part.slice(cut + 1)}.rels`
}

type Rel = { id: string; type: string; target: string; external: boolean }

function readRels(parts: PptxParts, part: string): Map<string, Rel> {
  const out = new Map<string, Rel>()
  const source = parts.get(relsPathFor(part))
  if (!source) return out
  const root = parseXml(source)
  const base = part.slice(0, part.lastIndexOf('/'))
  for (const item of children(root, 'Relationship')) {
    const id = attr(item, 'Id')
    const target = attr(item, 'Target')
    if (!id || !target) continue
    const external = attr(item, 'TargetMode') === 'External'
    out.set(id, {
      id,
      // The type is a long URL whose last segment is the useful part.
      type: (attr(item, 'Type') ?? '').split('/').pop() ?? '',
      target: external ? target : resolvePath(base, target),
      external,
    })
  }
  return out
}

function firstRelOfType(rels: Map<string, Rel>, type: string): Rel | null {
  for (const rel of rels.values()) if (rel.type === type) return rel
  return null
}

function parsePart(parts: PptxParts, part: string | undefined | null): XNode | null {
  if (!part) return null
  const source = parts.get(part)
  return source ? parseXml(source) : null
}

/**
 * The theme and colour map in force for one slide.
 *
 * The chain is slide → layout → master → theme, and each link is a
 * relationship rather than a name, so it has to be followed rather than guessed
 * at. The colour map lives on the master and says what `bg1` and `tx1` mean;
 * a slide may override it with `<p:clrMapOvr>`. Getting this wrong is what
 * turns an imported dark deck into black text on a black page.
 */
function resolveContext(parts: PptxParts, slidePart: string, slide: XNode | null) {
  const slideRels = readRels(parts, slidePart)
  const layoutRel = firstRelOfType(slideRels, 'slideLayout')
  const layout = parsePart(parts, layoutRel?.target)
  const masterRel = layoutRel ? firstRelOfType(readRels(parts, layoutRel.target), 'slideMaster') : null
  const master = parsePart(parts, masterRel?.target)
  const themeRel = masterRel ? firstRelOfType(readRels(parts, masterRel.target), 'theme') : null
  const theme = parsePart(parts, themeRel?.target)

  const { scheme, majorFont, minorFont } = readTheme(theme)
  let map: ColorMap = readColorMap(child(master, 'clrMap'))
  const override = child(slide, 'clrMapOvr') ?? child(layout, 'clrMapOvr')
  const overrideMap = child(override, 'overrideClrMapping')
  if (overrideMap) map = readColorMap(overrideMap)

  return { slideRels, layout, master, scheme, map, fonts: { majorFont, minorFont } }
}

// ---- one shape ---------------------------------------------------------------

type SlideContext = {
  scheme: ColorScheme
  map: ColorMap
  fonts: { majorFont: string; minorFont: string }
  rels: Map<string, Rel>
  media: PptxMedia
  /** The page's own colour, so a text box can default to something readable on it. */
  ink: string
  index: number
  report: PptxImportReport
  fontSeen: Set<string>
}

function noteFont(context: SlideContext, from: string | undefined, to: string) {
  const wanted = (from ?? '').trim()
  if (!wanted || wanted.toLowerCase() === to.toLowerCase()) return
  const key = `${wanted}→${to}`
  if (context.fontSeen.has(key)) return
  context.fontSeen.add(key)
  context.report.fonts.push({ from: wanted, to })
}

function skip(context: SlideContext, what: string, reason: string) {
  context.report.skipped.push({ slide: context.index + 1, what, reason })
}

/** A shape's outline, when it has one that would be visible. */
function readOutline(spPr: XNode | null, context: SlideContext): { borderWidth: number; borderColor: string; borderStyle: string } | null {
  const ln = child(spPr, 'ln')
  if (!ln) return null
  if (child(ln, 'noFill')) return null
  const color = toDesignColor(colorInside(child(ln, 'solidFill'), context.scheme, context.map))
  if (!color) return null
  // `w` is in EMU; a line with no width set is PowerPoint's hairline, which is
  // three quarters of a point and rounds to 1px.
  const width = Math.max(1, Math.round(emuToPx(num(ln, 'w', 9525))))
  const dash = attr(child(ln, 'prstDash'), 'val') ?? 'solid'
  return {
    borderWidth: width,
    borderColor: color,
    borderStyle: dash.includes('dot') ? 'dotted' : dash === 'solid' ? 'solid' : 'dashed',
  }
}

/** The fill of a shape, or null when it is explicitly or implicitly unfilled. */
function readFill(spPr: XNode | null, context: SlideContext): string | null {
  if (!spPr) return null
  if (child(spPr, 'noFill')) return null
  const solid = child(spPr, 'solidFill')
  if (solid) return toDesignColor(colorInside(solid, context.scheme, context.map))
  const gradient = child(spPr, 'gradFill')
  if (gradient) {
    // A gradient becomes its first stop. The design format can hold a real
    // gradient, but only in the syntax the colour picker writes, and a
    // multi-stop DrawingML band with its own angle and scaling does not
    // reliably survive that trip — a flat colour that is one of the two is a
    // better starting point than a band that is neither.
    const stops = children(child(gradient, 'gsLst'), 'gs')
    for (const stop of stops) {
      const color = toDesignColor(colorInside(stop, context.scheme, context.map))
      if (color) return color
    }
  }
  return null
}

/**
 * How round a rounded rectangle's corners are, in design pixels.
 *
 * The format keeps this as an adjust value — a fraction of the shape's shorter
 * side, in thousandths of a percent — rather than a length, so that a shape
 * keeps its proportions when it is resized. A `roundRect` that does not say
 * gets PowerPoint's own default of one sixth, which is what makes the default
 * rounded rectangle look the way everyone expects.
 */
function cornerRadius(prstGeom: XNode | null, geom: string, box: { width: number; height: number }): number {
  if (geom === 'rect') return 0
  const formula = attr(find(prstGeom, 'gd'), 'fmla')
  const stated = formula?.startsWith('val ') ? Number(formula.slice(4)) : NaN
  const fraction = Number.isFinite(stated) ? percentOf(stated) : geom === 'roundRect' ? 1 / 6 : 0
  return Math.round(Math.min(box.width, box.height) * Math.min(0.5, Math.max(0, fraction)))
}

function baseWidget(box: { left: number; top: number; width: number; height: number }, rotate: number) {
  return {
    left: Math.round(box.left),
    top: Math.round(box.top),
    width: Math.max(1, Math.round(box.width)),
    height: Math.max(1, Math.round(box.height)),
    rotate: rotate ? Number(rotate.toFixed(2)) : 0,
  }
}

/** A `<p:sp>`: a shape, a text box, or — most often on a real slide — both. */
function readShape(node: XNode, transform: Transform, context: SlideContext): Record<string, any>[] {
  const spPr = child(node, 'spPr')
  const xfrm = readXfrm(spPr)
  // A placeholder with no geometry of its own inherits it from the layout. That
  // chain is not followed here, so the shape has no position to be placed at.
  if (!xfrm) {
    const body = child(node, 'txBody')
    const text = readTextBody(body, context.scheme, context.map, context.fonts, { color: context.ink, sizePx: 24 })
    if (text) skip(context, text.plain.slice(0, 40), 'inherits its position from the slide layout')
    return []
  }

  const box = place(transform, xfrm)
  if (box.width < MIN_SHAPE_PX || box.height < MIN_SHAPE_PX) return []

  const geom = attr(child(spPr, 'prstGeom'), 'prst') ?? (child(spPr, 'custGeom') ? 'custom' : 'rect')
  const fill = readFill(spPr, context)
  const outline = readOutline(spPr, context)
  const text = readTextBody(child(node, 'txBody'), context.scheme, context.map, context.fonts, { color: context.ink, sizePx: 24 })
  const out: Record<string, any>[] = []

  // The shape itself, when there is something to see. A text box is a `<p:sp>`
  // with no fill and no outline, and drawing a rectangle behind every one of
  // them would put an invisible layer under half the deck.
  const drawable = fill || outline
  if (drawable) {
    const isRect = RECT_GEOMS.has(geom)
    const isEllipse = ELLIPSE_GEOMS.has(geom)
    if (isRect || isEllipse) {
      const shape: Record<string, any> = {
        name: isEllipse ? 'Ellipse' : 'Rectangle',
        type: isEllipse ? 'w-ellipse' : 'w-rect',
        uuid: uuid(),
        ...baseWidget(box, xfrm.rot),
        color: fill ?? '#00000000',
        opacity: 1,
        borderWidth: outline?.borderWidth ?? 0,
        borderColor: outline?.borderColor ?? '#000000ff',
        borderStyle: outline?.borderStyle ?? 'solid',
        transform: '',
        parent: '-1',
        record: { width: 0, height: 0, minWidth: 4, minHeight: 4, dir: 'all' },
      }
      if (!isEllipse) shape.radius = cornerRadius(child(spPr, 'prstGeom'), geom, box)
      out.push(shape)
    } else {
      skip(context, `a ${geom} shape`, 'the editor has no matching shape')
    }
  }

  if (text) {
    const font = nearestFont(text.fontFamily)
    noteFont(context, text.requestedFamily, font.value)
    const widget = textWidget({
      left: box.left,
      top: box.top,
      width: box.width,
      height: box.height,
      fontSize: text.fontSize,
      lineHeight: text.lineHeight,
      color: text.color,
      font: fontChoice(font) as any,
      text: text.markup,
      fontWeight: text.fontWeight,
      textAlign: text.textAlign === 'justify' ? 'left' : text.textAlign,
    }) as Record<string, any>
    widget.fontStyle = text.fontStyle
    widget.textDecoration = text.textDecoration
    widget.listStyle = text.listStyle
    widget.rotate = xfrm.rot ? Number(xfrm.rot.toFixed(2)) : 0
    // The words sit where PowerPoint anchored them. The editor draws from the
    // top of the box, so a centred or bottom-anchored body is moved instead —
    // its height is what the text needs, not what the placeholder was.
    if (text.anchor !== 'top') {
      const needed = Math.min(box.height, text.fontSize * text.lineHeight * Math.max(1, text.plain.split('\n').length))
      widget.top = Math.round(box.top + (text.anchor === 'center' ? (box.height - needed) / 2 : box.height - needed))
      widget.height = Math.max(1, Math.round(needed))
    }
    out.push(widget)
  }
  return out
}

/** A `<p:pic>`: a picture the caller has already hosted, or nothing. */
function readPicture(node: XNode, transform: Transform, context: SlideContext): Record<string, any>[] {
  const spPr = child(node, 'spPr')
  const xfrm = readXfrm(spPr)
  if (!xfrm) return []
  const box = place(transform, xfrm)
  if (box.width < MIN_SHAPE_PX || box.height < MIN_SHAPE_PX) return []

  const blip = find(child(node, 'blipFill'), 'blip')
  const embed = attr(blip, 'embed') ?? attr(blip, 'r:embed')
  const rel = embed ? context.rels.get(embed) : null
  const name = attr(find(node, 'cNvPr'), 'name') ?? 'a picture'

  if (!rel || rel.external) {
    skip(context, name, rel?.external ? 'links to a picture outside the file' : 'its picture is missing from the file')
    return []
  }
  const image = context.media.get(rel.target)
  if (!image) {
    skip(context, name, 'its picture could not be brought across')
    return []
  }

  const widget = imageWidget(box.left, box.top, box.width, box.height, image) as Record<string, any>
  widget.rotate = xfrm.rot ? Number(xfrm.rot.toFixed(2)) : 0
  if (xfrm.flipH || xfrm.flipV) widget.flip = xfrm.flipH && xfrm.flipV ? 'both' : xfrm.flipH ? 'horizontal' : 'vertical'
  const outline = readOutline(spPr, context)
  if (outline) Object.assign(widget, outline)
  return [widget]
}

/** A `<p:graphicFrame>`, which is a table when it is anything this can read. */
function readGraphicFrame(node: XNode, transform: Transform, context: SlideContext): Record<string, any>[] {
  const xfrm = child(node, 'xfrm')
  const off = child(xfrm, 'off')
  const ext = child(xfrm, 'ext')
  const table = find(node, 'tbl')
  const name = attr(find(node, 'cNvPr'), 'name') ?? 'an object'

  if (!table) {
    // A chart, a diagram or an embedded object. Each is a whole subsystem of
    // its own and none of them has a widget to become.
    const kind = find(node, 'chart') ? 'a chart' : find(node, 'diagram') ? 'a SmartArt diagram' : 'an embedded object'
    skip(context, name, `${kind} cannot be edited in the designer`)
    return []
  }
  if (!off || !ext) return []

  const box = place(transform, { x: num(off, 'x'), y: num(off, 'y'), cx: num(ext, 'cx'), cy: num(ext, 'cy') })
  const rows = children(table, 'tr')
  if (!rows.length) return []

  const gridCols = children(child(table, 'tblGrid'), 'gridCol')
  const widths = gridCols.map((col) => num(col, 'w', 1))
  const total = widths.reduce((sum, value) => sum + value, 0) || 1
  const cols = Math.max(1, gridCols.length || children(rows[0]!, 'tc').length)

  const cells: string[][] = []
  let headerColor = ''
  let headerFill = ''
  for (const [rowIndex, row] of rows.entries()) {
    const line: string[] = []
    for (const cell of children(row, 'tc')) {
      const text = readTextBody(child(cell, 'txBody'), context.scheme, context.map, context.fonts, { color: context.ink, sizePx: 18 })
      line.push(text?.markup ?? '')
      if (rowIndex === 0 && text) {
        headerColor ||= text.color
        headerFill ||= toDesignColor(colorInside(child(child(cell, 'tcPr'), 'solidFill'), context.scheme, context.map)) ?? ''
      }
    }
    while (line.length < cols) line.push('')
    cells.push(line.slice(0, cols))
  }

  const first = rows[0] ? readTextBody(child(children(rows[0], 'tc')[0] ?? null, 'txBody'), context.scheme, context.map, context.fonts, { color: context.ink, sizePx: 18 }) : null
  const font = nearestFont(first?.fontFamily)
  return [
    {
      name: 'Table',
      type: 'w-table',
      uuid: uuid(),
      ...baseWidget(box, 0),
      rows: cells.length,
      cols,
      cells,
      colWidths: widths.length === cols ? widths.map((value) => value / total) : new Array(cols).fill(1 / cols),
      // `firstRow` is PowerPoint's own flag for "this table has a heading".
      headerRow: attr(find(node, 'tblPr'), 'firstRow') === '1',
      borderWidth: 1,
      borderColor: '#00000033',
      borderStyle: 'solid',
      headerFill: headerFill || '#00000010',
      headerColor: headerColor || context.ink,
      bodyFill: '#00000000',
      altFill: '#00000000',
      color: first?.color ?? context.ink,
      fontClass: fontChoice(font),
      fontSize: first?.fontSize ?? 18,
      fontWeight: 'normal',
      lineHeight: 1.4,
      textAlign: 'left',
      cellPadding: 8,
      opacity: 1,
      transform: '',
      parent: '-1',
      record: { width: 0, height: 0, minWidth: 40, minHeight: 20, dir: 'all' },
    },
  ]
}

/** Everything in one shape tree, flattened into slide coordinates. */
function readTree(tree: XNode | null, transform: Transform, context: SlideContext, depth = 0): Record<string, any>[] {
  if (!tree || depth > 12) return []
  const out: Record<string, any>[] = []
  for (const node of tree.children) {
    switch (node.local) {
      case 'sp':
        out.push(...readShape(node, transform, context))
        break
      case 'pic':
        out.push(...readPicture(node, transform, context))
        break
      case 'graphicFrame':
        out.push(...readGraphicFrame(node, transform, context))
        break
      case 'grpSp': {
        // The group's own box and the coordinate space its children are drawn
        // in are two different rectangles, and the ratio between them is the
        // scale. `chExt` of zero would be a divide by zero, and does happen in
        // files written by other tools.
        const xfrm = child(child(node, 'grpSpPr'), 'xfrm')
        const off = child(xfrm, 'off')
        const ext = child(xfrm, 'ext')
        const chOff = child(xfrm, 'chOff')
        const chExt = child(xfrm, 'chExt')
        let inner = transform
        if (off && ext && chOff && chExt) {
          const chCx = num(chExt, 'cx', 0)
          const chCy = num(chExt, 'cy', 0)
          const sx = chCx ? num(ext, 'cx') / chCx : 1
          const sy = chCy ? num(ext, 'cy') / chCy : 1
          inner = {
            sx: transform.sx * sx,
            sy: transform.sy * sy,
            tx: transform.tx + emuToPx(num(off, 'x') - num(chOff, 'x') * sx) * transform.sx,
            ty: transform.ty + emuToPx(num(off, 'y') - num(chOff, 'y') * sy) * transform.sy,
          }
        }
        out.push(...readTree(node, inner, context, depth + 1))
        break
      }
      case 'cxnSp': {
        // A connector is a line. It has no widget, but a horizontal or vertical
        // one is a rule, and rules are half the furniture of a school deck.
        const spPr = child(node, 'spPr')
        const xfrm = readXfrm(spPr)
        const outline = readOutline(spPr, context)
        if (!xfrm || !outline) break
        const box = place(transform, xfrm)
        const horizontal = Math.abs(box.width) >= Math.abs(box.height)
        out.push({
          name: 'Rectangle',
          type: 'w-rect',
          uuid: uuid(),
          left: Math.round(box.left),
          top: Math.round(box.top),
          width: Math.max(1, Math.round(horizontal ? box.width : outline.borderWidth)),
          height: Math.max(1, Math.round(horizontal ? outline.borderWidth : box.height)),
          rotate: xfrm.rot ? Number(xfrm.rot.toFixed(2)) : 0,
          color: outline.borderColor,
          opacity: 1,
          borderWidth: 0,
          borderColor: '#000000ff',
          borderStyle: 'solid',
          radius: 0,
          transform: '',
          parent: '-1',
          record: { width: 0, height: 0, minWidth: 1, minHeight: 1, dir: 'all' },
        })
        break
      }
      default:
        break
    }
  }
  return out
}

// ---- the whole file ----------------------------------------------------------

/** The paths a caller has to host before importing. */
export function pptxMediaPaths(paths: Iterable<string>): string[] {
  const out: string[] = []
  for (const item of paths) if (item.startsWith(PPTX_MEDIA_PREFIX)) out.push(item)
  return out
}

/**
 * Whether a colour is dark enough that white text belongs on it.
 *
 * Used only to pick the default ink for a slide whose text does not say what
 * colour it is — which is most text on most slides, because the colour usually
 * comes from the placeholder in the layout.
 */
function inkFor(background: string): string {
  const hex = background.replace('#', '').slice(0, 6)
  if (hex.length < 6) return '#000000'
  const [r, g, b] = [0, 2, 4].map((at) => parseInt(hex.slice(at, at + 2), 16))
  return 0.299 * r! + 0.587 * g! + 0.114 * b! < 140 ? '#ffffff' : '#000000'
}

function readBackground(source: XNode | null, context: { scheme: ColorScheme; map: ColorMap }): string | null {
  const bg = child(source, 'bg')
  if (!bg) return null
  const properties = child(bg, 'bgPr')
  if (properties) return toDesignColor(colorInside(child(properties, 'solidFill'), context.scheme, context.map))
  // `<p:bgRef idx="1001">` points into the theme's fill list and carries its own
  // colour override, which is the part worth reading.
  const ref = child(bg, 'bgRef')
  if (ref) return toDesignColor(colorInside(ref, context.scheme, context.map))
  return null
}

/**
 * A PowerPoint package, as a design.
 *
 * Throws only when the file is not a presentation at all. Everything short of
 * that — a slide that will not parse, a picture that is not there, a chart —
 * lands in the report and leaves the rest of the deck intact, because a deck
 * that imports with one slide missing is worth far more than an error message.
 */
export function importPptx(parts: PptxParts, options: PptxImportOptions = {}): PptxImportResult {
  const presentation = parsePart(parts, 'ppt/presentation.xml')
  if (!presentation) throw new Error('That file is not a PowerPoint presentation.')

  const size = child(presentation, 'sldSz')
  const slideEmuWidth = num(size, 'cx', 12192000)
  const slideEmuHeight = num(size, 'cy', 6858000)
  const rawWidth = emuToPx(slideEmuWidth)
  const rawHeight = emuToPx(slideEmuHeight)

  // A design is stored at the editor's own slide scale. A 16:9 deck is 1280 x
  // 720 css pixels read literally, and the editor's page is 1920 x 1080, so
  // everything is scaled by the ratio of the longest sides. This is the inverse
  // of `slideScale` in exportPptx, and it means a deck exported and reimported
  // comes back the size it started.
  const scale = SLIDE_PAGE.width / Math.max(rawWidth, rawHeight)
  const pageWidth = Math.round(rawWidth * scale)
  const pageHeight = Math.round(rawHeight * scale)

  const presentationRels = readRels(parts, 'ppt/presentation.xml')
  const order = children(child(presentation, 'sldIdLst'), 'sldId')
  const slidePaths: string[] = []
  for (const item of order) {
    const id = attr(item, 'r:id') ?? attr(item, 'id')
    const rel = id ? presentationRels.get(id) : null
    if (rel && !rel.external && parts.has(rel.target)) slidePaths.push(rel.target)
  }
  if (!slidePaths.length) throw new Error('That presentation has no slides in it.')
  if (slidePaths.length > MAX_PPTX_SLIDES) {
    throw new Error(`That presentation has ${slidePaths.length} slides. The designer holds ${MAX_PPTX_SLIDES}.`)
  }

  const media = options.media ?? new Map()
  const report: PptxImportReport = { slides: slidePaths.length, widgets: 0, skipped: [], fonts: [] }
  const fontSeen = new Set<string>()
  const layouts: TdLayout[] = []

  for (const [index, slidePart] of slidePaths.entries()) {
    const slide = parsePart(parts, slidePart)
    const cSld = child(slide, 'cSld')
    const { slideRels, layout, master, scheme, map, fonts } = resolveContext(parts, slidePart, slide)

    // The slide's own background, then the layout's, then the master's — which
    // is the order PowerPoint resolves it in, and the reason a deck whose
    // colour is set once on the master does not import white.
    const background = readBackground(cSld, { scheme, map }) ?? readBackground(child(layout, 'cSld'), { scheme, map }) ?? readBackground(child(master, 'cSld'), { scheme, map }) ?? '#ffffff'

    const context: SlideContext = {
      scheme,
      map,
      fonts,
      rels: slideRels,
      media,
      ink: inkFor(background),
      index,
      report,
      fontSeen,
    }

    const layers = readTree(child(cSld, 'spTree'), IDENTITY(scale), context)
    report.widgets += layers.length

    // The notes part holds the whole notes page, of which one placeholder is
    // the words. Plain text, because that is all `notes` is.
    const notesRel = firstRelOfType(slideRels, 'notesSlide')
    const notesTree = notesRel ? child(child(parsePart(parts, notesRel.target), 'cSld'), 'spTree') : null
    let notes = ''
    if (notesTree) {
      for (const node of children(notesTree, 'sp')) {
        const type = attr(find(node, 'ph'), 'type')
        if (type !== 'body') continue
        const text = readTextBody(child(node, 'txBody'), scheme, map, fonts, { color: '#000000', sizePx: 18 })
        if (text) notes = notes ? `${notes}\n${text.plain}` : text.plain
      }
    }

    layouts.push({
      global: page(`Slide ${index + 1}`, pageWidth, pageHeight, background, notes || null),
      layers: layers as TdLayout['layers'],
    })
  }

  // `dc:title` in the package's own properties is what the file calls itself,
  // which is usually better than the filename and is what PowerPoint shows.
  const coreTitle = find(parsePart(parts, 'docProps/core.xml'), 'title')?.text?.trim()

  return {
    document: {
      format: 'design-studio/v1',
      title: (options.title?.trim() || coreTitle || 'Imported presentation').slice(0, 200),
      layouts,
    },
    report,
  }
}
