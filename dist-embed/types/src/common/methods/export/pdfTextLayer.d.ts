export type EncodedRun = {
    fontIndex: number;
    hex: string;
    count: number;
};
/**
 * Hands out one-byte codes to whatever characters the document turns out to
 * contain, and remembers enough to write the `/ToUnicode` map back out.
 */
export declare class InvisibleFonts {
    private slots;
    private points;
    private slotFor;
    /** How many fonts the document needs. Zero when it has no text at all. */
    get fontCount(): number;
    /**
     * Turns a string into runs of hex, split wherever the codes cross from one
     * font into the next.
     *
     * Iterated by code point rather than by UTF-16 unit, so an emoji or any other
     * character outside the basic plane takes one code and comes back out of
     * `/ToUnicode` as the surrogate pair it started as.
     */
    encode(text: string): EncodedRun[];
    /** The code points held by one font, in code order starting at code 1. */
    private pointsIn;
    /** The font dictionary, minus the two references only the writer can supply. */
    fontDict(fontIndex: number, toUnicodeRef: string): string;
    /**
     * The CMap that says what each code means.
     *
     * `bfchar` blocks are capped at 100 entries by the specification, so the
     * mapping is written out in hundreds.
     */
    toUnicodeCMap(fontIndex: number): string;
}
/** The name a page's `/Resources` gives one of the fonts. */
export declare const fontName: (fontIndex: number) => string;
export type InvisibleRun = {
    text: string;
    /** Where the baseline starts, in points from the bottom-left of the page. */
    x: number;
    y: number;
    /** How far the run goes along its baseline, in points. */
    width: number;
    /** Em size in points. Only sets the height of the selectable band. */
    size: number;
    /** Baseline direction, anticlockwise from the x axis, in radians. */
    angle: number;
};
/**
 * One run of unseen text, as a content-stream fragment.
 *
 * The horizontal scale is the whole trick: the declared width of the string is
 * known exactly (half an em a character, by construction), the width it has to
 * cover was measured off the page, and `Tz` is the ratio between them. Returns
 * an empty string for anything with no text or nowhere to put it, so a caller
 * can concatenate without checking.
 */
export declare function drawInvisibleRun(line: InvisibleRun, fonts: InvisibleFonts): string;
