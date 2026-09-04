/**
 * Exports a design as a PowerPoint (.pptx) file.
 *
 * Every page of the design becomes one slide, and the slide is sized to match
 * the page so nothing is cropped or letterboxed.
 *
 * There are two ways to do it, because they suit different jobs:
 *
 *  - 'editable' rebuilds the design out of real PowerPoint objects. Text stays
 *    text, so whoever opens the file can retype it, restyle it or run it
 *    through a translator. Anything the format cannot express natively (a
 *    masked photo, a QR code, text with an outline) is turned into a picture
 *    of just that element, so it still looks right.
 *
 *  - 'picture' puts a flat image of each page on its slide. Nothing is
 *    editable, but it is guaranteed to look exactly like the editor.
 */
import PptxGenJS from 'pptxgenjs'
import downloadBlob from '@/common/methods/download/downloadBlob'
import { imageFilterCss } from '../imageFilters'
import type { TdLayout, TdWidgetData } from '@/store/types'
import { readTable } from '@/components/modules/widgets/wTable/tableModel'
import { htmlToText, imageToDataUrl, isInvisible, pxToInches, pxToPoints, readRotation, safeFileName, toPptxColor } from './utils'
import { htmlToPptxRuns } from './textRuns'

export type PptxMode = 'editable' | 'picture'

export type PptxOptions = {
  title: string
  mode: PptxMode
  /** Called with 0-100 so the caller can drive a progress bar. */
  onProgress?: (percent: number, message: string) => void
  /** Renders one page to a PNG data URL. Required for 'picture' mode. */
  renderPage?: (pageIndex: number) => Promise<string | null>
  /** Renders a single element to a PNG data URL, used for the fallbacks. */
  renderWidget?: (pageIndex: number, widget: TdWidgetData) => Promise<string | null>
}

/** Widget types that have a native PowerPoint equivalent. */
const NATIVE_TYPES = new Set(['w-text', 'w-image', 'w-table'])

/**
 * Text with an outline, a gradient fill, a shadow or a lean relies on CSS the
 * .pptx format has no equivalent for, so those get rasterised instead of being
 * flattened into plain text that would look wrong.
 */
function hasUnsupportedTextEffects(widget: TdWidgetData): boolean {
  const effects = (widget as any).textEffects
  if (!Array.isArray(effects) || effects.length === 0) return false
  return effects.some((e: any) => e?.stroke?.enable || e?.shadow?.enable || e?.skew?.enable || e?.offset?.enable || (e?.filling?.enable && Number(e.filling.type) !== 0))
}

function needsRaster(widget: TdWidgetData): boolean {
  const type = String(widget.type)
  if (type === 'w-group') return false // a container; its children are placed individually
  if (!NATIVE_TYPES.has(type)) return true
  if (type === 'w-image' && (widget as any).mask) return true
  // A PowerPoint picture has no keyline of its own to set, so a photograph
  // wearing one goes in as a picture of itself rather than as a bare photograph
  // with the outline quietly dropped.
  if (type === 'w-image' && Number((widget as any).borderWidth) > 0) return true
  // Nor any way to brighten, blur or wash a picture, so an adjusted photograph
  // goes in as a picture of itself with the adjustments already made.
  if (type === 'w-image' && imageFilterCss(widget.filters)) return true
  if (type === 'w-text' && hasUnsupportedTextEffects(widget)) return true
  // A PowerPoint text box runs in a straight line, and the WordArt shapes that
  // do not are a different object with none of this one's styling, so a curved
  // run goes in as a picture of itself rather than as text that has quietly
  // straightened out.
  if (type === 'w-text' && Number((widget as any).curve)) return true
  // A PowerPoint table cannot be turned, so a tilted one goes in as a picture.
  if (type === 'w-table' && readRotation(widget)) return true
  return false
}

/**
 * The longest side any slide should be, in inches.
 *
 * A design is stored in CSS pixels, and 1920x1080 read literally at 96 DPI is a
 * 20-inch-wide slide — valid, but nothing like a normal deck, so it looks wrong
 * next to real slides and merges badly into an existing presentation. Scaling
 * the longest side down to 13.333in turns a 16:9 design into exactly
 * PowerPoint's standard widescreen slide, and leaves every other shape
 * proportionally correct.
 */
const MAX_SLIDE_INCHES = 13.333

function slideScale(widthPx: number, heightPx: number): number {
  const longest = Math.max(pxToInches(widthPx), pxToInches(heightPx))
  return longest > MAX_SLIDE_INCHES ? MAX_SLIDE_INCHES / longest : 1
}

/** Where a widget sits on the slide, in inches, at the deck's scale. */
function frame(widget: TdWidgetData, scale: number) {
  return {
    x: pxToInches(widget.left as number) * scale,
    y: pxToInches(widget.top as number) * scale,
    w: Math.max(pxToInches(widget.width as number) * scale, 0.01),
    h: Math.max(pxToInches(widget.height as number) * scale, 0.01),
  }
}

function addTextWidget(slide: PptxGenJS.Slide, widget: TdWidgetData, scale: number) {
  const text = htmlToText((widget as any).text)
  if (!text.trim()) return

  const { color, transparency } = toPptxColor((widget as any).color, '000000')
  const fontSize = pxToPoints((widget as any).fontSize || 16) * scale
  const lineHeight = Number((widget as any).lineHeight) || 1.5
  const align = ((widget as any).textAlign || 'left') as 'left' | 'center' | 'right' | 'justify'
  const fill = (widget as any).backgroundColor

  // One run per formatted piece of each line, so a bolded word, a coloured
  // date or a link comes out as one in the deck — see textRuns.ts.
  slide.addText(htmlToPptxRuns((widget as any).text, (widget as any).listStyle), {
    ...frame(widget, scale),
    fontFace: (widget as any).fontClass?.value || 'Inter',
    fontSize,
    color,
    transparency,
    bold: String((widget as any).fontWeight) === 'bold' || Number((widget as any).fontWeight) >= 600,
    italic: (widget as any).fontStyle === 'italic',
    underline: (widget as any).textDecoration === 'underline' ? { style: 'sng' } : undefined,
    strike: (widget as any).textDecoration === 'line-through',
    align: align === 'justify' ? 'justify' : align,
    valign: 'top',
    // The editor draws text from the top of the box with no inset; match it,
    // otherwise every text box shifts down and right in PowerPoint.
    margin: 0,
    lineSpacingMultiple: Math.min(Math.max(lineHeight, 0.5), 4),
    charSpacing: pxToPoints((((widget as any).fontSize || 16) * (Number((widget as any).letterSpacing) || 0)) / 100) * scale,
    rotate: readRotation(widget) || undefined,
    fill: fill && !isInvisible(fill) ? { color: toPptxColor(fill).color } : undefined,
    shrinkText: false,
    wrap: true,
  })
}

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high)

/**
 * A table as a real PowerPoint table, so whoever opens the deck can retype a
 * cell, add a row or restyle it. Each cell carries its own fill, colour and
 * border because that is how the format holds them — there is no table-wide
 * style to set once. The rows are given an even share of the table's height:
 * the editor lets the words set the height and holds only the total, and an
 * even split keeps the table exactly the size it was on the page.
 */
function addTableWidget(slide: PptxGenJS.Slide, widget: TdWidgetData, scale: number) {
  const table = readTable(widget)
  const w = widget as any
  const box = frame(widget, scale)
  const fontSize = pxToPoints(w.fontSize || 16) * scale
  const textColor = toPptxColor(w.color, '000000').color
  const headerColor = toPptxColor(w.headerColor || w.color, 'FFFFFF').color
  const borderWidth = Number(w.borderWidth) || 0
  const border: PptxGenJS.BorderProps = borderWidth > 0 && !isInvisible(w.borderColor) ? { type: w.borderStyle === 'dashed' || w.borderStyle === 'dotted' ? 'dash' : 'solid', pt: Math.max(0.25, pxToPoints(borderWidth) * scale), color: toPptxColor(w.borderColor, '000000').color } : { type: 'none' }
  const align = (['left', 'center', 'right'].includes(w.textAlign) ? w.textAlign : 'left') as 'left' | 'center' | 'right'
  const margin = pxToInches(Number(w.cellPadding) || 0) * scale

  const fillFor = (row: number): PptxGenJS.ShapeFillProps | undefined => {
    const paint = (colour: unknown) => (typeof colour === 'string' && colour && !isInvisible(colour) ? { color: toPptxColor(colour).color } : undefined)
    if (table.headerRow && row === 0) return paint(w.headerFill)
    const bodyIndex = table.headerRow ? row - 1 : row
    return (bodyIndex % 2 === 1 ? paint(w.altFill) : undefined) ?? paint(w.bodyFill)
  }

  const rows: PptxGenJS.TableRow[] = table.cells.map((line, r) =>
    line.map((cell) => ({
      text: htmlToText(cell),
      options: {
        fill: fillFor(r),
        color: table.headerRow && r === 0 ? headerColor : textColor,
        bold: table.headerRow && r === 0 ? true : String(w.fontWeight) === 'bold',
        align,
        valign: 'top',
        margin,
        border,
      },
    })),
  )

  slide.addTable(rows, {
    x: box.x,
    y: box.y,
    w: box.w,
    h: box.h,
    colW: table.colWidths.map((fraction) => fraction * box.w),
    rowH: box.h / table.rows,
    fontFace: w.fontClass?.value || 'Inter',
    fontSize,
    autoPage: false,
  })
}

/**
 * The shadow an image or a shape casts, as PowerPoint states one.
 *
 * The editor holds a shadow the way CSS does — an x, a y and a blur, in pixels.
 * PowerPoint holds a direction and a distance, in points. Same shadow, so it
 * goes in as a real shadow the recipient can edit rather than being baked into
 * a picture, and it stays put when they move the object.
 */
function pptxShadow(widget: TdWidgetData, scale: number): PptxGenJS.ShadowProps | undefined {
  const shadow = widget.shadow
  if (!shadow?.enable) return undefined
  const x = Number(shadow.offsetX) || 0
  const y = Number(shadow.offsetY) || 0
  const { color, transparency } = toPptxColor(shadow.color, '000000')
  return {
    type: 'outer',
    color,
    opacity: clamp(1 - (transparency ?? 0) / 100, 0, 1),
    blur: clamp(pxToPoints(Math.max(0, Number(shadow.blur) || 0)) * scale, 0, 100),
    offset: clamp(pxToPoints(Math.hypot(x, y)) * scale, 0, 200),
    // OOXML measures the direction clockwise from due east, and so does atan2
    // over screen coordinates, where y grows downwards. They already agree.
    angle: (Math.round((Math.atan2(y, x) * 180) / Math.PI) + 360) % 360,
  }
}

async function addImageWidget(slide: PptxGenJS.Slide, widget: TdWidgetData, scale: number) {
  const url = (widget as any).imgUrl
  if (!url) return
  const data = await imageToDataUrl(url)
  if (!data) return false

  slide.addImage({
    data,
    ...frame(widget, scale),
    rotate: readRotation(widget) || undefined,
    transparency: toPptxColor(
      `#000000${Math.round(Number((widget as any).opacity ?? 1) * 255)
        .toString(16)
        .padStart(2, '0')}`,
    ).transparency,
    rounding: false,
    shadow: pptxShadow(widget, scale),
  })
  return true
}

async function addRasterWidget(slide: PptxGenJS.Slide, widget: TdWidgetData, pageIndex: number, scale: number, render?: PptxOptions['renderWidget']) {
  if (!render) return
  const data = await render(pageIndex, widget)
  if (!data) return
  // The picture is drawn without the element's shadow — see `capture` — so the
  // shadow is put back here, where PowerPoint can cast it outside the frame.
  slide.addImage({ data, ...frame(widget, scale), shadow: pptxShadow(widget, scale) })
}

/** Paints the page background onto the slide: a colour, a gradient's base, or an image. */
async function applyBackground(slide: PptxGenJS.Slide, page: Record<string, any>) {
  const image = page.backgroundImage
  if (image) {
    const data = await imageToDataUrl(image)
    if (data) {
      slide.background = { data }
      return
    }
  }
  const colour = page.backgroundColor || page.backgroundGradient
  if (colour) {
    // A CSS gradient has no .pptx equivalent as a slide background, so use its
    // first colour stop, which is the closest honest approximation.
    const firstStop = String(colour).match(/#[0-9a-f]{3,8}/i)?.[0] || colour
    const { color } = toPptxColor(firstStop, 'FFFFFF')
    slide.background = { color }
    return
  }
  slide.background = { color: 'FFFFFF' }
}

/**
 * The deck itself, as a Blob.
 *
 * Split from the download for the same reason the PDF is: a host that embeds
 * the editor wants the bytes to POST somewhere, not a file in the user's
 * Downloads folder. pptxgenjs will hand back either, so the two paths differ
 * only in what they ask it for.
 */
export async function buildPptx(layouts: TdLayout[], options: PptxOptions): Promise<Blob> {
  const { title, mode, onProgress, renderPage, renderWidget } = options
  const pages = layouts.filter(Boolean)
  if (pages.length === 0) throw new Error('There is nothing to export.')

  const pptx = new PptxGenJS()
  pptx.author = 'Design Studio'
  pptx.title = title || 'Untitled design'

  // Size the slide to the first page. PowerPoint uses one slide size for the
  // whole deck, so pages of other sizes are fitted into it below.
  const first = pages[0].global as Record<string, any>
  const scale = slideScale(first.width, first.height)
  const deckWidth = pxToInches(first.width) * scale
  const deckHeight = pxToInches(first.height) * scale
  pptx.defineLayout({ name: 'DESIGN', width: deckWidth, height: deckHeight })
  pptx.layout = 'DESIGN'

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i].global as Record<string, any>
    const layers = (pages[i].layers || []) as TdWidgetData[]
    const slide = pptx.addSlide()

    onProgress?.(Math.round(((i + 0.1) / pages.length) * 90), `Building slide ${i + 1} of ${pages.length}`)

    // Speaker notes go into PowerPoint's own notes pane, in either mode: they
    // are for the person presenting, not part of the picture of the page.
    if (typeof page.notes === 'string' && page.notes.trim()) slide.addNotes(page.notes)

    if (mode === 'picture') {
      const data = renderPage ? await renderPage(i) : null
      if (data) {
        slide.addImage({ data, x: 0, y: 0, w: deckWidth, h: deckHeight })
      } else {
        await applyBackground(slide, page)
      }
      continue
    }

    await applyBackground(slide, page)

    // A group is never drawn itself, so hiding one has to be read off its
    // children — they are what this loop places on the slide.
    const hiddenGroups = new Set(layers.filter((widget) => widget.hidden && widget.isContainer).map((widget) => widget.uuid))

    for (const widget of layers) {
      if (String(widget.type) === 'w-group') continue
      if (widget.hidden || (widget.parent && hiddenGroups.has(widget.parent))) continue
      if ((widget as any).opacity === 0) continue

      try {
        if (needsRaster(widget)) {
          await addRasterWidget(slide, widget, i, scale, renderWidget)
        } else if (widget.type === 'w-text') {
          addTextWidget(slide, widget, scale)
        } else if (widget.type === 'w-table') {
          addTableWidget(slide, widget, scale)
        } else if (widget.type === 'w-image') {
          const placed = await addImageWidget(slide, widget, scale)
          // A cross-origin image we could not read still has to appear, so
          // fall back to a picture of the element as drawn on screen.
          if (placed === false) await addRasterWidget(slide, widget, i, scale, renderWidget)
        }
      } catch (e) {
        // One bad element must not cost the whole deck.
        console.warn('[pptx] skipped an element', widget.type, e)
      }
    }
  }

  onProgress?.(95, 'Writing the file')
  const blob = (await pptx.write({ outputType: 'blob' })) as Blob
  // pptxgenjs writes its own type, which some readers use to decide what the
  // file is. Say it outright rather than leaving it to whatever came back.
  return blob.type ? blob : new Blob([blob], { type: PPTX_TYPE })
}

const PPTX_TYPE = 'application/vnd.openxmlformats-officedocument.presentationml.presentation'

export async function exportPptx(layouts: TdLayout[], options: PptxOptions): Promise<void> {
  const blob = await buildPptx(layouts, options)
  downloadBlob(blob, safeFileName(options.title, 'pptx'))
  options.onProgress?.(100, 'Your PowerPoint file has been downloaded')
}

export default exportPptx
