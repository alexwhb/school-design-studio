/**
 * Writes a design out as a PDF — one page of the design per page of the file.
 *
 * PDF is what a school actually sends onward: to a print shop, attached to an
 * email home, or up onto the website. Nothing else the editor produces is right
 * for that. A PNG has no page size, so a print shop has to guess how big you
 * meant it; a .pptx is a deck someone has to own PowerPoint to open.
 *
 * Each page is drawn as a picture, not rebuilt out of PDF text and shapes. That
 * is the trade this file makes deliberately: an editable PDF would mean a
 * second renderer to keep in step with the browser's, and the failure mode for
 * a poster is a font substituting at the print shop rather than anything you
 * could edit anyway. What you see is what prints. The editable route already
 * exists and is called PowerPoint.
 *
 * ## The part a picture cannot do
 *
 * A page that is only a picture is unreadable to a screen reader, unsearchable
 * and uncopyable, and a newsletter posted on a school website is covered by
 * Section 508 and by the UK's public sector regulations, both of which point
 * at WCAG 2.1 AA. An untagged image-only PDF fails it outright.
 *
 * So the picture is kept and a second, invisible layer is laid over it: the
 * real text, in the real places, in reading order, plus a structure tree naming
 * the headings and carrying each picture's alt text as a Figure's `/Alt`. It is
 * the arrangement a scanner produces when it OCRs a page. Nothing about the
 * printed result changes and everything about the readable one does. See
 * pdfTextLayer.ts for how the text is drawn without being seen, and
 * accessibility/structure.ts for where headings and reading order come from.
 *
 * What it cannot do, and does not pretend to: the words are real, but anything
 * baked into the picture that is not a text box stays a picture — lettering
 * inside a photo, a table's cells (tables are not read out yet), text drawn as
 * part of an SVG. A picture with no alt text is announced as "Image with no
 * description" rather than skipped, so a listener knows something is there;
 * the check before download is what keeps that from happening.
 *
 * There is no PDF library here. Putting a picture on a page is a hundred lines
 * of a thirty-year-old file format, and jsPDF is about 350kB on a bundle that
 * is already a megabyte. The structure below is a complete, valid tagged PDF: a
 * catalogue with a title and a language, a page tree, a structure tree, and per
 * page a content stream that draws one JPEG across the whole media box with the
 * text over the top.
 */
import downloadBlob from '@/common/methods/download/downloadBlob'
import { safeFileName } from './utils'
import { PdfWriter, num, pdfDate, pdfString } from './pdfWriter'
import { InvisibleFonts, drawInvisibleRun, fontName, type InvisibleRun } from './pdfTextLayer'
import type { ContentRun, PageContent } from './pageContent'
import type { TdLayout } from '@/store/types'

/**
 * How many design pixels make an inch of paper.
 *
 * The editor stores a page in pixels and nothing records how big it is meant to
 * be in the world, so the number has to come from somewhere. 150 is the
 * convention the page presets are already built on — "Letter — portrait" is
 * 1275 × 1650, which is 8.5 × 11 inches at 150 — so reading them back at 150
 * returns exactly the paper size the person picked. Read at the CSS-pixel 96
 * instead, that same Letter page would come out as a 13 × 17 inch sheet.
 *
 * It lives in `dpi.ts` and is re-exported here, so that code with no browser
 * behind it can read the number without loading this file's canvas work.
 */
export { DESIGN_DPI, pxToPdfPoints } from './dpi'
import { pxToPdfPoints } from './dpi'

/** Multiplier applied to the render. 1 gives 150 DPI, 2 gives 300, 3 gives 450. */
export type ExportScale = 1 | 2 | 3

/**
 * JPEG rather than lossless: a 300 DPI Letter page is 16 megapixels, which is
 * about 50MB uncompressed and still several MB deflated, and nobody can email
 * that. At this quality the artefacts are invisible in print, which is the
 * standard trade every "download as PDF" makes.
 */
const JPEG_QUALITY = 0.92

/** What a screen reader announces the document is written in, when the page does not say. */
const DEFAULT_LANGUAGE = 'en-US'

export type RasterPage = {
  jpeg: Uint8Array
  pixelWidth: number
  pixelHeight: number
  widthPt: number
  heightPt: number
  content: PageContent | null
}

export type PdfOptions = {
  title: string
  scale: ExportScale
  renderPage: (pageIndex: number, scale: number) => Promise<string | null>
  /**
   * The readable structure of a page: its text, in reading order, with the
   * headings named and the pictures described. Without it the export still
   * works and produces what it always did, a picture per page, but tagged, with
   * a title and a language.
   */
  contentFor?: (pageIndex: number) => Promise<PageContent | null> | PageContent | null
  /** BCP 47 tag for the document's language. Anything that is not one is ignored. */
  language?: string
  onProgress?: (percent: number, message: string) => void
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('The rendered page could not be read back.'))
    img.src = src
  })
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Turns the renderer's PNG into the JPEG that goes inside the PDF.
 *
 * The page is drawn onto white first. The renderer captures with a transparent
 * backdrop so a design with no background colour exports as a transparent PNG,
 * which is right for a PNG and meaningless on paper — and JPEG has no alpha, so
 * without this the transparent parts would come out black.
 */
async function rasterise(dataUrl: string): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const img = await loadImage(dataUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser could not prepare the page for export.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0)
  const jpeg = canvas.toDataURL('image/jpeg', JPEG_QUALITY)
  // Let the canvas go before the next page allocates another one this size.
  canvas.width = 0
  canvas.height = 0
  return { bytes: base64ToBytes(jpeg.split(',')[1] || ''), width: img.naturalWidth, height: img.naturalHeight }
}

/**
 * A design pixel is measured from the top of the page downwards and a PDF point
 * from the bottom upwards, so every y has to be turned over. Turning y over
 * also reverses which way an angle goes round, which is why the rotation comes
 * through negated.
 */
function toPdfRun(run: ContentRun, heightPt: number): InvisibleRun {
  return {
    text: run.text,
    x: pxToPdfPoints(run.x),
    y: heightPt - pxToPdfPoints(run.y),
    width: pxToPdfPoints(run.length),
    size: pxToPdfPoints(run.size),
    angle: (-run.angle * Math.PI) / 180,
  }
}

/** A language tag, or the default. Anything unexpected is not worth passing on. */
export function safeLanguage(input?: string): string {
  const tag = String(input || '').trim()
  return /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(tag) ? tag : DEFAULT_LANGUAGE
}

/** One tagged thing on a page, and where it lives in the structure tree. */
type StructElement = {
  id: number
  /** A standard structure type: H1 to H3, P, or Figure. */
  tag: string
  mcid: number
  pageIndex: number
  alt?: string
}

/**
 * Assembles the file.
 *
 * Two passes, because the parts refer to each other in both directions. The
 * first walks the pages building content streams, which is where the tagged
 * items get their marked-content ids and where the text layer finds out which
 * characters the document contains. Only then is it known how many fonts the
 * file needs, so the second pass writes everything out with every reference
 * resolved.
 */
export function assemblePdf(pages: RasterPage[], title: string, language: string): Blob {
  const writer = new PdfWriter()
  const fonts = new InvisibleFonts()

  const catalogId = writer.alloc()
  const pageTreeId = writer.alloc()
  const structRootId = writer.alloc()
  const documentId = writer.alloc()
  const parentTreeId = writer.alloc()
  const infoId = writer.alloc()

  const pageIds = pages.map(() => ({ page: writer.alloc(), content: writer.alloc(), image: writer.alloc() }))

  const elements: StructElement[][] = []
  const streams: string[] = []

  pages.forEach((page, pageIndex) => {
    const parts: string[] = []
    const pageElements: StructElement[] = []
    let mcid = 0

    // The whole page is one picture and the picture is not the content; the
    // content is the layer over it. Marking it an artifact is what stops a
    // screen reader announcing an unlabelled graphic the size of the sheet.
    parts.push('/Artifact BMC\n')
    parts.push(`q ${num(page.widthPt)} 0 0 ${num(page.heightPt)} 0 0 cm /Im0 Do Q\n`)
    parts.push('EMC\n')

    for (const item of page.content?.items || []) {
      if (item.kind === 'text') {
        const drawn = item.runs.map((run) => drawInvisibleRun(toPdfRun(run, page.heightPt), fonts)).join('')
        if (!drawn) continue
        parts.push(`/${item.tag} << /MCID ${mcid} >> BDC\n${drawn}EMC\n`)
        pageElements.push({ id: writer.alloc(), tag: item.tag, mcid, pageIndex })
      } else {
        // A figure needs somewhere to be as well as something to say, and the
        // picture it refers to is baked into the page image. An empty path is
        // the smallest thing that occupies the right rectangle and draws
        // nothing: `re` puts a rectangle on the current path, `n` discards it.
        const x = pxToPdfPoints(item.box.left)
        const y = page.heightPt - pxToPdfPoints(item.box.top + item.box.height)
        const w = pxToPdfPoints(item.box.width)
        const h = pxToPdfPoints(item.box.height)
        parts.push(`/Figure << /MCID ${mcid} >> BDC\n${num(x)} ${num(y)} ${num(w)} ${num(h)} re n\nEMC\n`)
        pageElements.push({ id: writer.alloc(), tag: 'Figure', mcid, pageIndex, alt: item.alt })
      }
      mcid++
    }

    elements.push(pageElements)
    streams.push(parts.join(''))
  })

  const fontIds = Array.from({ length: fonts.fontCount }, () => ({ font: writer.alloc(), toUnicode: writer.alloc() }))
  const fontResource = fontIds.length ? ` /Font << ${fontIds.map((ids, index) => `${fontName(index)} ${PdfWriter.ref(ids.font)}`).join(' ')} >>` : ''

  writer.begin()

  writer.object(
    catalogId,
    `<< /Type /Catalog /Pages ${PdfWriter.ref(pageTreeId)} /Lang ${pdfString(language)}` +
      ` /MarkInfo << /Marked true >> /StructTreeRoot ${PdfWriter.ref(structRootId)}` +
      // Without this a reader shows the file's name in its title bar instead
      // of the document's, which is what WCAG 2.4.2 asks for.
      ' /ViewerPreferences << /DisplayDocTitle true >> >>',
  )

  writer.object(pageTreeId, `<< /Type /Pages /Kids [${pageIds.map((ids) => PdfWriter.ref(ids.page)).join(' ')}] /Count ${pages.length} >>`)

  pages.forEach((page, pageIndex) => {
    const ids = pageIds[pageIndex]
    writer.object(
      ids.page,
      `<< /Type /Page /Parent ${PdfWriter.ref(pageTreeId)} /MediaBox [0 0 ${num(page.widthPt)} ${num(page.heightPt)}]` +
        ` /Resources << /XObject << /Im0 ${PdfWriter.ref(ids.image)} >>${fontResource} >>` +
        ` /Contents ${PdfWriter.ref(ids.content)} /StructParents ${pageIndex}` +
        // Tab order follows the structure, so moving through the page goes in
        // reading order rather than in the order things were drawn.
        ' /Tabs /S >>',
    )
    writer.stream(ids.content, '', streams[pageIndex])
    writer.stream(ids.image, `/Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode`, page.jpeg)
  })

  const all = elements.flat()
  writer.object(structRootId, `<< /Type /StructTreeRoot /K ${PdfWriter.ref(documentId)} /ParentTree ${PdfWriter.ref(parentTreeId)} /ParentTreeNextKey ${pages.length} >>`)
  writer.object(documentId, `<< /Type /StructElem /S /Document /P ${PdfWriter.ref(structRootId)} /K [${all.map((element) => PdfWriter.ref(element.id)).join(' ')}] >>`)

  for (const element of all) {
    // UTF-16 hex, so a description can say anything a person typed, brackets
    // and backslashes included, without any of it being read as PDF syntax.
    const alt = element.alt ? ` /Alt ${pdfString(element.alt)}` : ''
    writer.object(element.id, `<< /Type /StructElem /S /${element.tag} /P ${PdfWriter.ref(documentId)} /Pg ${PdfWriter.ref(pageIds[element.pageIndex].page)} /K ${element.mcid}${alt} >>`)
  }

  // The reverse index: for each page, which structure element owns each
  // marked-content id on it. A reader uses it to answer "what is this thing I
  // just landed on", and a validator refuses a tagged file without it.
  const nums = elements.map((pageElements, pageIndex) => `${pageIndex} [${pageElements.map((element) => PdfWriter.ref(element.id)).join(' ')}]`).join(' ')
  writer.object(parentTreeId, `<< /Nums [${nums}] >>`)

  fontIds.forEach((ids, index) => {
    writer.object(ids.font, fonts.fontDict(index, PdfWriter.ref(ids.toUnicode)))
    writer.stream(ids.toUnicode, '', fonts.toUnicodeCMap(index))
  })

  writer.object(infoId, `<< /Title ${pdfString(title)} /Producer ${pdfString('Design Studio')} /CreationDate (${pdfDate(new Date())}) >>`)

  return writer.finish(`/Root ${PdfWriter.ref(catalogId)} /Info ${PdfWriter.ref(infoId)}`)
}

/**
 * The file itself, as a Blob.
 *
 * Split from the download so that a host embedding the editor can take the
 * bytes and do something else with them — attach the PDF to a task, put it in
 * its own object store — without a file landing in the user's Downloads folder
 * on the way past. The download below is this plus one line, so there is no
 * second way of building a PDF to keep in step.
 */
export async function buildPdf(pages: TdLayout[], options: PdfOptions): Promise<Blob> {
  const { title, scale, renderPage, contentFor, language, onProgress } = options
  if (!pages.length) throw new Error('There is nothing to export yet.')

  const rendered: RasterPage[] = []
  for (let index = 0; index < pages.length; index++) {
    const share = Math.round((index / pages.length) * 80)
    onProgress?.(5 + share, pages.length === 1 ? 'Drawing your design' : `Drawing page ${index + 1} of ${pages.length}`)

    // Before the render, because measuring reads the page as the browser laid
    // it out and the render replaces parts of a copy of it.
    let content: PageContent | null = null
    try {
      content = (await contentFor?.(index)) ?? null
    } catch (e) {
      // A page whose text could not be read is a page without a text layer,
      // not a failed export. Better a picture than nothing.
      console.warn('[pdf] could not read the text on page', index + 1, e)
    }

    const dataUrl = await renderPage(index, scale)
    if (!dataUrl) throw new Error(`Page ${index + 1} could not be drawn.`)
    const raster = await rasterise(dataUrl)
    const global = pages[index].global

    rendered.push({
      jpeg: raster.bytes,
      pixelWidth: raster.width,
      pixelHeight: raster.height,
      // Paper size comes from the design, not from the render: turning the
      // resolution up puts more pixels on the same sheet rather than a bigger
      // sheet, which is what someone asking for 300 DPI means.
      widthPt: pxToPdfPoints(global.width),
      heightPt: pxToPdfPoints(global.height),
      content,
    })
  }

  onProgress?.(92, 'Building the PDF')
  return assemblePdf(rendered, title || 'Untitled design', safeLanguage(language))
}

export default async function exportPdf(pages: TdLayout[], options: PdfOptions): Promise<void> {
  downloadBlob(await buildPdf(pages, options), safeFileName(options.title, 'pdf'))
}
