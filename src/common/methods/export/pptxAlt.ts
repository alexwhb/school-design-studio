/**
 * Alt text for the pictures in an exported PowerPoint.
 *
 * pptxgenjs takes an `altText` for each picture and writes it, escaped, into
 * the picture's `descr`, which is what PowerPoint shows under Edit Alt Text and
 * what a screen reader reads out. Given nothing, it writes the file name it
 * made up instead, so every undescribed photo in a deck was announced as
 * "preencoded.png". And it has no way to say a picture is decorative.
 *
 * So the description goes in through `altText`, and after the file is written
 * each slide is passed over once more: a made-up file name becomes an empty
 * description, and a picture somebody marked decorative gets the extension
 * PowerPoint itself writes for its Mark as decorative box, so a reader skips it
 * rather than announcing an unlabelled image.
 */
import { altTextOf, textOf } from '@/common/methods/accessibility/structure'
import type { TdWidgetData } from '@/store/types'

export type PptxAlt = { text: string; decorative: boolean }

/**
 * What a picture on a slide should say. A text box that had to be drawn as a
 * picture, because PowerPoint cannot draw its effect, says its own words.
 */
export function pptxAltFor(widget: TdWidgetData): PptxAlt {
  if (widget.type === 'w-text') return { text: textOf(widget), decorative: false }
  const alt = altTextOf(widget)
  return alt.state === 'described' ? { text: alt.text, decorative: false } : { text: '', decorative: alt.state === 'decorative' }
}

/** What pptxgenjs writes in `descr` for a picture it was given as data and no alt text. */
const MADE_UP_NAME = 'preencoded.png'

/** The element PowerPoint writes when Mark as decorative is ticked. */
const DECORATIVE = '<a:extLst><a:ext uri="{C183D7F6-B498-43B3-948B-1728B52AA6E4}"><adec:decorative xmlns:adec="http://schemas.microsoft.com/office/drawing/2017/decorative" val="1"/></a:ext></a:extLst>'

/**
 * One slide's XML, with its pictures' descriptions put right. `alts` is keyed
 * by the `objectName` each picture was given. A picture not in it, which is a
 * page background, is decoration.
 */
export function applySlideAlt(xml: string, alts: ReadonlyMap<string, PptxAlt>): string {
  // Only the open-and-close form: that is how pptxgenjs writes a picture, and
  // a text box's self-closing `cNvPr` has no picture to describe.
  return xml.replace(/<p:cNvPr id="(\d+)" name="([^"]*)" descr="([^"]*)">([\s\S]*?)<\/p:cNvPr>/g, (whole, id: string, name: string, descr: string, inner: string) => {
    const alt = alts.get(name)
    const decorative = alt ? alt.decorative : true
    const text = descr === MADE_UP_NAME || decorative ? '' : descr
    const extra = decorative && !inner.includes('adec:decorative') ? DECORATIVE : ''
    return `<p:cNvPr id="${id}" name="${name}" descr="${text}">${inner}${extra}</p:cNvPr>`
  })
}
