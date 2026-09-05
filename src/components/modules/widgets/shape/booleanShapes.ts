/**
 * Combining two or more drawn shapes into one: add, subtract, intersect and
 * exclude, the four Adobe XD offers.
 *
 * Three decisions are worth knowing before reading the rest.
 *
 * **The answer is a new shape, not a live boolean group.** XD keeps the
 * operands and re-evaluates the operation whenever one of them is edited, so a
 * boolean can be taken apart again months later. That is a widget type of its
 * own, with its own selection behaviour, its own panel and its own re-entrant
 * evaluation, and it is several times the work of this. What happens here is a
 * flatten: the operands are replaced by the shape they make, in one undoable
 * step, and undo is how you take it apart. If a live version is ever wanted,
 * this file is the geometry it would need — it is the widget lifecycle around
 * it that would be new.
 *
 * **The result is a `w-svg`, because nothing else can hold it.** A path drawn
 * with the pen holds one contour and one only, so a circle with a hole in it,
 * or a bar cut into two pieces, has nowhere to live in a `w-path`. A `w-svg`
 * carries inline markup, which holds as many subpaths as the answer needs — and
 * it carries a `colors` list, which is what keeps the result recolourable in
 * the Design panel like any other shape rather than baking a fill into markup.
 * The markup is deliberately plain: one `<svg>`, one `<path>`, no styles, no
 * defs, no external references. The planner refuses a design whose markup
 * carries a script, an event attribute, a `<foreignObject>`, SMIL or a
 * `javascript:`/`data:` reference, and refuses a `data:image/svg+xml` URL
 * outright, so nothing here may grow into one.
 *
 * **The work happens in page space.** Each operand is turned into a curve where
 * it appears on the page — rotation and all — because that is the only place
 * where "these two overlap" means what the eye means by it. A boolean done in
 * each widget's own coordinates would quietly ignore every rotation on screen,
 * which is the classic way to get a result that is geometrically perfect and
 * obviously wrong.
 *
 * The curves are real curves throughout. paper.js works on beziers, so an
 * ellipse cut by another ellipse comes out as arcs rather than as a fan of
 * short straight lines that shows up the moment a poster is printed. It is set
 * up headless — a size, no canvas on the page — because nothing here is ever
 * drawn; the project is scratch space for the arithmetic and is emptied again
 * as soon as the answer is out.
 */
import paper from 'paper/dist/paper-core'
import type { TdWidgetData } from '@/store/types'
import { viewBoxOf } from '@/utils/svgPaint'
import { endsPad } from '../wPath/lineEnds'
import { isClosed, paintBox, pathD, readPoints } from '../wPath/pathGeometry'
import { polygonPath, readSides } from '../wPolygon/polygonShape'
import { readCorners } from '../wRect/rectRadius'
import { widgetBorder } from '../widgetBorder'
import { wSvgSetting } from '../wSvg/wSvgSetting'
import { SHAPE_DEFAULT_FILL } from './shapeSetting'

/** The four operations, named as paper.js names them and as XD arranges them. */
export type TBooleanOp = 'unite' | 'subtract' | 'intersect' | 'exclude'

/**
 * The kinds of widget that have an outline to combine. A photograph, a piece of
 * text, a table, a QR code and a group are not shapes — there is no closed
 * curve to hand to a boolean — so a selection holding one of them cannot be
 * combined at all, and the buttons say so by being unavailable.
 */
const OPERAND_TYPES = ['w-rect', 'w-ellipse', 'w-polygon', 'w-path', 'w-svg']

/** True when this layer can take part in a boolean operation. */
export function canCombine(widget: Record<string, any> | null | undefined): boolean {
  return !!widget && OPERAND_TYPES.includes(String(widget.type))
}

/** Two decimals, the same precision every other shape in the editor is written at. */
function round(value: number): number {
  return Math.round(value * 100) / 100
}

/**
 * The scratch project the arithmetic happens in: a size, and no canvas on the
 * page.
 *
 * One project, set up once and emptied between operations rather than made
 * afresh per click, because paper holds on to every project it is given for the
 * lifetime of the page. It is paper's own scope rather than a second
 * `PaperScope`, which would read more tidily and be wrong: activating a scope
 * rebinds paper's idea of which one is current, and every item made afterwards
 * would land in a project this module has no reference to. The view's size is
 * arbitrary, because nothing here is ever drawn.
 */
let ready = false

function workspace(): paper.Project {
  if (!ready) {
    paper.setup(new paper.Size(1, 1))
    ready = true
  }
  paper.project.clear()
  return paper.project
}

/**
 * A quarter-circle corner, from wherever the path has got to round to `to`.
 *
 * `arcTo(through, to)` wants a point on the arc rather than a radius, so the
 * one on the corner's diagonal is worked out here: the bisector of the two
 * radii, at the corner's own radius. A corner with no radius is a corner.
 */
function corner(path: paper.Path, to: paper.Point, centre: paper.Point): void {
  const from = path.lastSegment.point
  const radius = from.getDistance(centre)
  if (radius <= 0) {
    path.lineTo(to)
    return
  }
  const bisector = from.subtract(centre).normalize().add(to.subtract(centre).normalize())
  path.arcTo(centre.add(bisector.normalize(radius)), to)
}

/** A box with its four corners rounded by however much each of them asks for. */
function roundedRect(width: number, height: number, radii: number[]): paper.PathItem {
  const [tl, tr, br, bl] = radii
  if (!tl && !tr && !br && !bl) return new paper.Path.Rectangle(new paper.Rectangle(0, 0, width, height))

  const point = (x: number, y: number) => new paper.Point(x, y)
  const path = new paper.Path()
  path.moveTo(point(tl, 0))
  path.lineTo(point(width - tr, 0))
  corner(path, point(width, tr), point(width - tr, tr))
  path.lineTo(point(width, height - br))
  corner(path, point(width - br, height), point(width - br, height - br))
  path.lineTo(point(bl, height))
  corner(path, point(0, height - bl), point(bl, height - bl))
  path.lineTo(point(0, tl))
  corner(path, point(tl, 0), point(tl, tl))
  path.closePath()
  return path
}

/**
 * Every contour in an item closed off.
 *
 * A boolean is an argument about areas, and an open curve has none. An open
 * path drawn with the pen is already filled on the canvas — SVG closes it with
 * a straight run to work out what to paint — so closing it here combines the
 * shape that is on screen rather than inventing one.
 */
function closeUp(item: paper.PathItem): paper.PathItem {
  if (item instanceof paper.Path) {
    item.closed = true
    return item
  }
  for (const child of item.children) {
    if (child instanceof paper.Path) child.closed = true
  }
  return item
}

/** A path drawn with the pen, laid out in the box it is actually painted in. */
function penShape(widget: Record<string, any>, width: number, height: number): paper.PathItem | null {
  // The same box PathPaint draws into, outline and arrowheads and all, so the
  // curve that is combined is the curve that is on screen.
  const box = paintBox(width, height, widgetBorder(widget)?.width || 0, endsPad(widget))
  const d = pathD(readPoints(widget), isClosed(widget), box)
  if (!d) return null
  return closeUp(paper.PathItem.create(d))
}

/** Every path inside an imported drawing, however deeply it is grouped. */
function collectPaths(item: paper.Item, into: paper.Path[]): void {
  if (item instanceof paper.Path) {
    if (item.segments.length > 1) into.push(item)
    return
  }
  for (const child of item.children || []) collectPaths(child, into)
}

/**
 * A shape stored as markup, turned back into curves the size the widget draws
 * it at.
 *
 * The widget stretches its markup to its own frame — shapes are stored with a
 * viewBox and drawn with `preserveAspectRatio="none"` — so the viewBox is
 * mapped onto the frame here by hand. By hand, and not by leaving the root's
 * own `width`, `height` and `preserveAspectRatio` in place for paper to
 * interpret, because then the mapping would be paper's reading of an aspect
 * ratio rather than the one the canvas uses, and a stretched shape would
 * combine as the square it was drawn as.
 *
 * Two things about a drawing are not carried over. A stroke is read as the
 * contour it traces rather than as a stroke, so an icon drawn as lines — every
 * Lucide one is — combines as the silhouette you would get by filling it. That
 * is the only reading that gives a boolean an area to work on, and it is what
 * the browser would paint if the icon were asked to fill itself. And a hole
 * survives only if it was drawn to survive under the non-zero rule, wound the
 * opposite way round to the shape it sits in, which is how SVG's default fill
 * rule and paper both read it; a hole that relied on `fill-rule="evenodd"`
 * with both contours wound the same way fills in.
 */
function markupShape(widget: Record<string, any>, width: number, height: number): paper.PathItem | null {
  const markup = String(widget.svgUrl || '')
  if (!markup.trim().startsWith('<')) return null

  const parsed = new DOMParser().parseFromString(markup, 'image/svg+xml')
  const root = parsed.documentElement as unknown as SVGSVGElement
  if (!root || root.nodeName === 'parsererror' || root.querySelector('parsererror')) return null

  const view = viewBoxOf(root)
  if (!(view.width > 0 && view.height > 0)) return null
  for (const attribute of ['width', 'height', 'viewBox', 'preserveAspectRatio']) root.removeAttribute(attribute)

  let imported: paper.Item | null = null
  try {
    imported = paper.project.importSVG(root, { expandShapes: true, insert: true })
  } catch {
    return null
  }
  if (!imported) return null

  const paths: paper.Path[] = []
  collectPaths(imported, paths)
  if (paths.length === 0) return null

  const combined = new paper.CompoundPath({ children: paths.map((path) => closeUp(path)), insert: true })
  combined.translate(new paper.Point(-view.x, -view.y))
  combined.scale(width / view.width, height / view.height, new paper.Point(0, 0))
  return combined
}

/** The outline of one widget, in its own coordinates: 0,0 is its top-left corner. */
function localShape(widget: Record<string, any>, width: number, height: number): paper.PathItem | null {
  switch (String(widget.type)) {
    case 'w-rect':
      return roundedRect(width, height, readCorners(widget))
    case 'w-ellipse':
      return new paper.Path.Ellipse(new paper.Rectangle(0, 0, width, height))
    case 'w-polygon':
      return paper.PathItem.create(polygonPath(width, height, readSides(widget)))
    case 'w-path':
      return penShape(widget, width, height)
    case 'w-svg':
      return markupShape(widget, width, height)
    default:
      return null
  }
}

/**
 * How far the widget is turned, in degrees.
 *
 * The store keeps it as CSS writes it — `rotate: '45deg'` — and a design made
 * before shapes had their own key may carry the turn inside `transform`
 * instead, which is where Moveable used to leave it.
 */
function rotationOf(widget: Record<string, any>): number {
  const own = Number.parseFloat(String(widget.rotate ?? ''))
  if (Number.isFinite(own)) return own
  const held = /rotate\(\s*(-?[\d.]+)deg\s*\)/.exec(String(widget.transform || ''))
  return held ? Number.parseFloat(held[1]) : 0
}

/**
 * One widget as it appears on the page: its outline, turned about its own
 * centre and moved to where it sits.
 *
 * The centre is the middle of the frame because that is CSS's default
 * `transform-origin`, which is what the canvas, the thumbnails and every export
 * draw the turn about.
 */
function pageShape(widget: Record<string, any>): paper.PathItem | null {
  const width = Math.max(Number(widget.width) || 0, 0)
  const height = Math.max(Number(widget.height) || 0, 0)
  if (width <= 0 || height <= 0) return null

  const shape = localShape(widget, width, height)
  if (!shape) return null

  const angle = rotationOf(widget)
  if (angle) shape.rotate(angle, new paper.Point(width / 2, height / 2))
  shape.translate(new paper.Point(Number(widget.left) || 0, Number(widget.top) || 0))
  return shape
}

/**
 * The fill the result takes: the bottom-most operand's, whatever kind of shape
 * that is. A drawn shape keeps its colour in `color`; a shape stored as markup
 * keeps a list of them and the first is the one the artwork fills with.
 */
function fillOf(widget: Record<string, any>): string {
  if (String(widget.type) === 'w-svg') return widget.colors?.[0] || SHAPE_DEFAULT_FILL
  return widget.color || SHAPE_DEFAULT_FILL
}

/**
 * Paper writes five decimals, which is four more than a design pixel can show
 * and about a third of the length of the markup.
 */
function trimPathData(d: string): string {
  return d.replace(/-?\d+\.\d+/g, (value) => String(round(Number(value))))
}

/**
 * The markup the result is stored as: one path, filled through the widget's
 * colour list so the Design panel can still repaint it.
 *
 * `fill-rule="evenodd"` because the answer to a boolean is often several
 * contours with holes among them — a ring, a bar cut in two — and even-odd is
 * the rule that reads a contour inside another as a hole whichever way round it
 * was drawn. `preserveAspectRatio="none"` so the shape stretches to its frame
 * like every other shape in the library does.
 */
function shapeMarkup(d: string, width: number, height: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none"><path fill-rule="evenodd" fill="{{colors[0]}}" d="${d}"/></svg>`
}

/**
 * The shape `operands` make under `op`, or null when they make nothing at all —
 * an intersection of two shapes that do not touch, or a subtraction that takes
 * everything away.
 *
 * `operands` must be in z-order, bottom first. Subtract is bottom minus
 * everything above it, which is what XD does and the only ordering anybody
 * predicts; the rest are order-independent as operations but are folded in the
 * same order for the same reason.
 *
 * The result inherits the **bottom-most** operand's fill, outline, opacity and
 * shadow. Every other operand's paint is lost. That is XD's rule, and it is
 * deliberate rather than incidental: the alternatives are to keep the topmost
 * one's (which is Illustrator's, and surprises anyone who came from XD) or to
 * try to blend several fills into one, which has no sensible answer. The layer
 * name goes too — the result is a new shape, and a subtraction still called
 * "Blue banner" is a worse label than "Shape".
 */
export function combinedShape(op: TBooleanOp, operands: readonly Record<string, any>[]): TdWidgetData | null {
  if (operands.length < 2 || !operands.every(canCombine)) return null

  const project = workspace()
  try {
    const shapes: paper.PathItem[] = []
    for (const widget of operands) {
      const shape = pageShape(widget)
      if (!shape) return null
      shapes.push(shape)
    }

    let result = shapes[0]
    for (let index = 1; index < shapes.length; index += 1) result = result[op](shapes[index])
    if (!result || result.isEmpty()) return null

    const bounds = result.bounds
    const width = round(bounds.width)
    const height = round(bounds.height)
    // A result thinner than a design pixel on either side is two shapes that
    // touched rather than overlapped. There is nothing there to select or
    // resize, so it is refused and the operands are left alone.
    if (width < 1 || height < 1) return null

    result.translate(new paper.Point(-bounds.x, -bounds.y))
    const d = trimPathData(result.pathData)
    if (!d) return null

    const bottom = operands[0]
    const widget = JSON.parse(JSON.stringify(wSvgSetting)) as Record<string, any>
    widget.left = round(bounds.x)
    widget.top = round(bounds.y)
    widget.width = width
    widget.height = height
    widget.svgUrl = shapeMarkup(d, width, height)
    widget.colors = [fillOf(bottom)]
    widget.opacity = Number(bottom.opacity ?? 1)
    widget.borderWidth = Number(bottom.borderWidth) || 0
    widget.borderColor = bottom.borderColor || '#000000ff'
    widget.borderStyle = bottom.borderStyle || 'solid'
    if (bottom.shadow) widget.shadow = JSON.parse(JSON.stringify(bottom.shadow))
    return widget as TdWidgetData
  } finally {
    project.clear()
  }
}
