/**
 * Bulleted and numbered lists for text widgets.
 *
 * Lists follow the whole-box model: the widget is a list or it is not, and
 * `listStyle` says which. The markers themselves are real <ul>/<ol> markup
 * inside `text`, because that one string is what the editable div, the effect
 * layers, the static renderer and the exporters all read; deriving markers any
 * other way would mean teaching all four about lists separately.
 *
 * The markup is deliberately flat — a single <ul> or <ol> of one-line <li>s.
 * Chromium's editor will happily produce nested lists and stray <div>s once the
 * caret gets going, so what comes back out of the editable div is normalised
 * before it is stored. The reading and writing of the lines themselves,
 * including the bold and the links inside them, is in utils/widgets/richText.ts.
 */
import { type TLineListStyle } from '../../../../utils/widgets/richText';
export type TListStyle = TLineListStyle;
/**
 * The visual lines of a widget's text as plain strings, whatever shape its
 * markup is in: plain text with newlines, <br>-separated, or a list the
 * browser has been editing.
 */
export declare function textToLines(html?: string): string[];
/**
 * The `text` a widget should hold to be rendered in the given list style. The
 * formatting inside each line comes through; only the line structure changes.
 */
export declare function applyListStyle(html: string | undefined, style: TListStyle): string;
