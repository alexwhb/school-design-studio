/** A run of the rendered text, as an offset into it and a length. */
export type TTextHit = {
    start: number;
    length: number;
};
export declare function renderedText(html: string | undefined): string;
/**
 * Every occurrence of `query` in the widget's rendered text, left to right and
 * non-overlapping, as offsets into that rendered text.
 */
export declare function findInMarkup(html: string | undefined, query: string, matchCase: boolean): TTextHit[];
/**
 * The widget's markup with each of `hits` replaced by `replacement`.
 *
 * Worked back to front, so a hit's offsets are still true when its turn comes:
 * splicing a later run cannot move an earlier one. A hit that spans two text
 * nodes — "14 June" written as "<b>14</b> June" — puts the whole replacement in
 * the first of them and empties its share of the rest, which is the only
 * reading of "replace this run" that keeps the surrounding markup intact.
 */
export declare function replaceInMarkup(html: string | undefined, hits: TTextHit[], replacement: string): string;
