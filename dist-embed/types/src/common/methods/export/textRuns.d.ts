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
import type PptxGenJS from 'pptxgenjs';
export declare function htmlToPptxRuns(html: string | undefined, listStyle?: string): PptxGenJS.TextProps[];
