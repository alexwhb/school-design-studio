/**
 * What markup a design is allowed to hold, decided without a browser.
 *
 * A text widget's `text` is an HTML string, and the planner stores those and
 * renders them back into every colleague's browser. So something has to say
 * what may be in one, and it has to be able to say it on a server, before the
 * bytes are written down — by the time a `<img src=x onerror=…>` is in the
 * database it is too late to be careful.
 *
 * The rule is the editor's own, not a second one: this file parses the markup
 * and `richText.ts` reads the tree and writes it back out. That writing is an
 * allowlist by construction rather than a list of forbidden tags — every run of
 * text is escaped and re-emitted inside at most six known elements, with a
 * colour normalised to a hex triple and a link normalised to an http, https,
 * mailto or tel address. An element nobody listed contributes its words and
 * nothing else; `<script>` and `<style>` contribute nothing at all. There is no
 * path by which an attribute survives, so there is no `onerror` to forget.
 *
 * The parser below is a tokeniser rather than a DOM, and it is deliberately
 * unambitious: it does not implement HTML's error recovery, only enough of it
 * that a document written by the editor, by a paste, or by a model round-trips
 * to the same string a browser would have produced. Anything it misreads it
 * misreads towards plain text.
 */
import { type TReadNode, type TLineListStyle } from '../utils/widgets/richText';
/**
 * The markup as a tree `richText.ts` can read.
 *
 * Text between tags is decoded; a `<` that starts nothing recognisable is text,
 * which is what makes `5 < 6` survive. Comments, doctypes and processing
 * instructions are skipped whole, so an `<!--` cannot be used to hide the start
 * of an element from the tokeniser and show it to a browser.
 */
export declare function parseMarkup(html: string): TReadNode;
/**
 * Markup pared back to what a design may hold, and written in the editor's own
 * canonical form.
 *
 * Safe by construction rather than by inspection. Nothing from the input is
 * copied into the output except the words, a colour that parsed as a colour,
 * and a link whose scheme is on the list. There is no branch on which an
 * attribute, an element or a URL scheme that was not expected reaches the
 * result, so there is nothing here to keep up to date as new attacks are
 * invented.
 */
export declare function sanitizeMarkup(html: string, listStyle?: TLineListStyle): string;
/** The words of some markup, with all of the formatting taken off. */
export declare function markupToText(html: string): string;
