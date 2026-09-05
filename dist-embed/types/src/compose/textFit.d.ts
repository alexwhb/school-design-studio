/**
 * Making a line of somebody else's words fit a box that was drawn for other
 * words, without a browser to measure with.
 *
 * The editor lets a text box grow with its content, which is right when a
 * person is watching: they see it happen and move something. Composing is the
 * opposite case — the text arrives from a model, nobody is watching, and a
 * heading two words longer than the designer's silently runs off the page and
 * into the export. So every box composed here is measured against its own size
 * first, and nothing is ever placed that does not fit.
 *
 * The measurement is an estimate, because there is no font engine here. Widths
 * are per-character, in fractions of the font size, taken from the shape of the
 * letters rather than from any one family, then scaled by a factor per family —
 * Anton and Bebas Neue are far narrower than Inter at the same size, and
 * treating them alike would either waste half a poster or overflow it. It is
 * deliberately a few per cent pessimistic: guessing a line is wider than it
 * turns out to be costs a slightly smaller heading, and guessing narrow costs a
 * heading off the edge of the page.
 */
export type TextMetrics = {
    fontFamily?: string;
    fontSize: number;
    /** Multiplier, as the widget stores it. */
    lineHeight: number;
    /** Design pixels added between characters, as the widget stores it. */
    letterSpacing?: number;
    bold?: boolean;
};
export declare function measureText(text: string, style: TextMetrics): number;
/**
 * The text broken at the spaces so that no line is wider than `width`.
 *
 * A word longer than the whole box is not broken up: hyphenating a school's
 * name in the middle looks like a bug, and the shrink step below is the answer
 * to a word that will not fit.
 */
export declare function wrapText(text: string, width: number, style: TextMetrics): string[];
export type FitOptions = {
    width: number;
    height: number;
    /** How small the type may get before the words are cut instead. */
    minFontSize: number;
    /** Hard ceiling on lines, whatever the height says. 0 is no ceiling. */
    maxLines?: number;
};
export type FitResult = {
    text: string;
    fontSize: number;
    lines: string[];
    /** True when words had to be dropped to make it fit. */
    truncated: boolean;
};
/**
 * Shrinks, then cuts.
 *
 * The type comes down a point at a time to the floor, which is where a poster's
 * headline stops being a headline. Only then are words dropped, and the cut is
 * marked with an ellipsis so it reads as deliberate rather than as a bug.
 */
export declare function fitText(text: string, style: TextMetrics, options: FitOptions): FitResult;
/** The height a fitted run actually takes on the page. */
export declare function heightOf(result: Pick<FitResult, 'lines' | 'fontSize'>, lineHeight: number): number;
