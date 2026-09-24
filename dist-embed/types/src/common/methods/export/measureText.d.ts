/**
 * Reads back where the browser actually put every word of text.
 *
 * The store knows a text widget's box and its font size. It does not know where
 * the words wrapped, and that is precisely what the text layer in the PDF needs
 * — a heading that reads as three lines on the page has to be three lines in
 * the file, in the right places, or selecting one of them highlights the wrong
 * part of the picture and a reader gets the words run together.
 *
 * Nothing here reimplements line breaking. The page is already on screen and
 * already laid out, so the measurements come from asking the browser, one
 * character at a time, which rectangle it ended up in. Characters that share a
 * rectangle edge are on the same line; within a line they are cut into words.
 *
 * Words rather than whole lines because the invisible text is set in a font
 * whose characters are all declared the same width — see pdfTextLayer.ts — so
 * positions drift across a long run even though its two ends are exact. Pinning
 * each word where it really is keeps that drift to the length of one word,
 * which is what stops a text extractor inventing line breaks in the middle of a
 * sentence.
 *
 * Everything comes back in page coordinates — design pixels, y downwards from
 * the top-left of the page — and with the widget's own rotation taken off, so
 * the caller has plain unrotated geometry plus an angle to apply.
 */
export type MeasuredWord = {
    /** The word, including the space after it where the browser drew one. */
    text: string;
    left: number;
    top: number;
    width: number;
    height: number;
};
export type MeasuredLine = {
    /** Text stacked downwards rather than running across, for vertical writing. */
    vertical: boolean;
    words: MeasuredWord[];
};
export type MeasuredText = {
    /** The widget's own box, unrotated, in page coordinates. */
    left: number;
    top: number;
    width: number;
    height: number;
    lines: MeasuredLine[];
};
/**
 * Measures every text widget currently on the canvas.
 *
 * Returns a map keyed by widget uuid; a widget that is not on screen, or holds
 * nothing, simply will not be in it, and the caller falls back to the store's
 * own geometry.
 */
export declare function measureTextOnCanvas(canvasId: string, uuids: readonly string[]): Map<string, MeasuredText>;
