/**
 * Writes a design out as a PDF — one page of the design per page of the file.
 *
 * PDF is what a school actually sends onward: to a print shop, or attached to
 * an email home. Nothing else the editor produces is right for that. A PNG has
 * no page size, so a print shop has to guess how big you meant it; a .pptx is a
 * deck someone has to own PowerPoint to open.
 *
 * Each page is a picture, not text and shapes rebuilt as PDF objects. That is
 * the trade this file makes deliberately: an editable PDF would mean a second
 * renderer to keep in step with the browser's, and the failure mode for a
 * poster is a font substituting at the print shop rather than anything you
 * could edit anyway. What you see is what prints. The editable route already
 * exists and is called PowerPoint.
 *
 * There is no PDF library here. Putting a picture on a page is a hundred lines
 * of a thirty-year-old file format, and jsPDF is about 350kB on a bundle that
 * is already a megabyte. The structure below is a complete, valid PDF 1.4: a
 * catalogue, a page tree, and per page a content stream that draws one JPEG
 * across the whole media box.
 */
import downloadBlob from '@/common/methods/download/downloadBlob'
import { safeFileName } from './utils'
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

type RasterPage = {
  jpeg: Uint8Array
  pixelWidth: number
  pixelHeight: number
  widthPt: number
  heightPt: number
}

export type PdfOptions = {
  title: string
  scale: ExportScale
  renderPage: (pageIndex: number, scale: number) => Promise<string | null>
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

/** Trims float noise out of the numbers written into the file. */
const num = (value: number): string => String(Math.round(value * 100) / 100)

/**
 * A PDF text string as UTF-16BE hex.
 *
 * The alternative is a literal string, which then has to escape backslashes and
 * both parentheses, and still cannot carry an accent. Design names come from
 * people, so they carry accents.
 */
function pdfString(value: string): string {
  let hex = 'FEFF'
  for (const character of value) {
    const code = character.codePointAt(0) as number
    if (code > 0xffff) {
      const offset = code - 0x10000
      hex += (0xd800 + (offset >> 10)).toString(16).padStart(4, '0')
      hex += (0xdc00 + (offset & 0x3ff)).toString(16).padStart(4, '0')
    } else {
      hex += code.toString(16).padStart(4, '0')
    }
  }
  return `<${hex.toUpperCase()}>`
}

function pdfDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `D:${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}

/**
 * Assembles the file.
 *
 * Object ids are worked out up front rather than as objects are written,
 * because the catalogue has to reference the page tree and the page tree has to
 * list every page before any of them exist. Byte offsets are tracked as we go:
 * the cross-reference table at the end is a list of where each object starts,
 * and a reader that finds one wrong reports the file as damaged.
 */
function assemblePdf(pages: RasterPage[], title: string): Blob {
  const encoder = new TextEncoder()
  const parts: Uint8Array[] = []
  let length = 0

  const put = (data: string | Uint8Array) => {
    const bytes = typeof data === 'string' ? encoder.encode(data) : data
    parts.push(bytes)
    length += bytes.length
  }

  const CATALOG = 1
  const PAGE_TREE = 2
  const pageId = (index: number) => 3 + index * 3
  const contentId = (index: number) => 4 + index * 3
  const imageId = (index: number) => 5 + index * 3
  const infoId = 3 + pages.length * 3
  const objectCount = infoId

  const offsets: number[] = new Array(objectCount + 1).fill(0)
  const open = (id: number) => {
    offsets[id] = length
    put(`${id} 0 obj\n`)
  }
  const close = () => put('endobj\n')

  put('%PDF-1.4\n')
  // Four bytes above 127, which is how a PDF declares itself binary. Without
  // it, anything that thinks it is moving text may rewrite the line endings
  // inside the JPEGs and quietly corrupt every page.
  put(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))

  open(CATALOG)
  put(`<< /Type /Catalog /Pages ${PAGE_TREE} 0 R >>\n`)
  close()

  open(PAGE_TREE)
  put(`<< /Type /Pages /Kids [${pages.map((_, i) => `${pageId(i)} 0 R`).join(' ')}] /Count ${pages.length} >>\n`)
  close()

  pages.forEach((page, index) => {
    open(pageId(index))
    put(`<< /Type /Page /Parent ${PAGE_TREE} 0 R /MediaBox [0 0 ${num(page.widthPt)} ${num(page.heightPt)}]` + ` /Resources << /XObject << /Im0 ${imageId(index)} 0 R >> >> /Contents ${contentId(index)} 0 R >>\n`)
    close()

    // Scale the unit image up to the media box and draw it: the whole page is
    // one picture, so there is no offset and nothing else in the stream.
    const content = `q ${num(page.widthPt)} 0 0 ${num(page.heightPt)} 0 0 cm /Im0 Do Q\n`
    open(contentId(index))
    put(`<< /Length ${encoder.encode(content).length} >>\nstream\n`)
    put(content)
    put('endstream\n')
    close()

    open(imageId(index))
    put(`<< /Type /XObject /Subtype /Image /Width ${page.pixelWidth} /Height ${page.pixelHeight}` + ` /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`)
    put(page.jpeg)
    put('\nendstream\n')
    close()
  })

  open(infoId)
  put(`<< /Title ${pdfString(title)} /Producer ${pdfString('Design Studio')} /CreationDate (${pdfDate(new Date())}) >>\n`)
  close()

  const startxref = length
  put(`xref\n0 ${objectCount + 1}\n`)
  // Every entry is exactly 20 bytes, including the two-byte ending. A reader
  // seeks by multiplying, so a short line breaks the whole table.
  put('0000000000 65535 f\r\n')
  for (let id = 1; id <= objectCount; id++) {
    put(`${String(offsets[id]).padStart(10, '0')} 00000 n\r\n`)
  }
  put(`trailer\n<< /Size ${objectCount + 1} /Root ${CATALOG} 0 R /Info ${infoId} 0 R >>\nstartxref\n${startxref}\n%%EOF\n`)

  return new Blob(parts as BlobPart[], { type: 'application/pdf' })
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
  const { title, scale, renderPage, onProgress } = options
  if (!pages.length) throw new Error('There is nothing to export yet.')

  const rendered: RasterPage[] = []
  for (let index = 0; index < pages.length; index++) {
    const share = Math.round((index / pages.length) * 80)
    onProgress?.(5 + share, pages.length === 1 ? 'Drawing your design' : `Drawing page ${index + 1} of ${pages.length}`)

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
    })
  }

  onProgress?.(92, 'Building the PDF')
  return assemblePdf(rendered, title || 'Untitled design')
}

export default async function exportPdf(pages: TdLayout[], options: PdfOptions): Promise<void> {
  downloadBlob(await buildPdf(pages, options), safeFileName(options.title, 'pdf'))
}
