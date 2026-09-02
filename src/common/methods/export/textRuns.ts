/**
 * A text widget's markup as PowerPoint text runs.
 *
 * A PowerPoint text box is paragraphs of runs, each run with its own weight,
 * slant, underline, colour and link — the same shape a text widget's lines and
 * runs have (see utils/widgets/richText.ts). So a word bolded in the editor is
 * a run with `bold` set, a link is a run with `hyperlink`, and the deck that
 * comes out is still editable text rather than a picture of it.
 *
 * A line ends a paragraph, which is what `breakLine` on its last run does. A
 * bulleted box gets a real bullet on each paragraph rather than a marker
 * character baked into the string, so the recipient can restyle the list.
 */
import type PptxGenJS from 'pptxgenjs'
import { htmlToLines } from '@/utils/widgets/richText'
import { toPptxColor } from './utils'

export function htmlToPptxRuns(html: string | undefined, listStyle?: string): PptxGenJS.TextProps[] {
  const lines = htmlToLines(html)
  const bullet = listStyle === 'number' ? ({ type: 'number' } as const) : listStyle === 'bullet' ? true : undefined
  const out: PptxGenJS.TextProps[] = []

  lines.forEach((line, lineIndex) => {
    const last = lineIndex === lines.length - 1
    // An empty line is still a paragraph, and needs a run to be one.
    const runs = line.length ? line : [{ text: '' }]
    runs.forEach((run, runIndex) => {
      const options: PptxGenJS.TextPropsOptions = {}
      if (run.bold) options.bold = true
      if (run.italic) options.italic = true
      if (run.underline) options.underline = { style: 'sng' }
      if (run.strike) options.strike = 'sngStrike'
      if (run.color) {
        const { color, transparency } = toPptxColor(run.color)
        options.color = color
        if (transparency) options.transparency = transparency
      }
      if (run.href) options.hyperlink = { url: run.href }
      // The bullet goes on the first run of the paragraph; pptxgenjs reads a
      // paragraph's properties off the run that opens it.
      if (bullet && runIndex === 0) options.bullet = bullet
      if (runIndex === runs.length - 1 && !last) options.breakLine = true
      out.push({ text: run.text, options })
    })
  })

  return out
}
