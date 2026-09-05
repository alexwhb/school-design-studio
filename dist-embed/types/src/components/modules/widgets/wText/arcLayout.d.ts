export type TCurvedGlyph = {
    char: string;
    /**
     * The character's own formatting, when the run it came from had any. A bold
     * word stays bold round the arc; each character is drawn with these and
     * measured in them, since a bold glyph is wider than its regular one.
     */
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    strike?: boolean;
    color?: string;
    /** The centre of the character's box, from the top left of the block. */
    x: number;
    y: number;
    /** How far the character is turned, in degrees, clockwise. */
    angle: number;
    /** The character's own advance width, which its box is set to. */
    width: number;
};
export type TCurvedLayout = {
    width: number;
    height: number;
    /**
     * How wide the longest line is laid out flat. The arc draws the ends of the
     * line in, so this is not the block's width — it is the width the box would
     * need if the same words were set straight, which is what a run that has
     * never been straight in this session is given back when its curve goes.
     */
    flatWidth: number;
    /** The height of one line's box. Every character is drawn in one that tall. */
    boxHeight: number;
    glyphs: TCurvedGlyph[];
};
export type TCurveInput = {
    text?: string;
    /** How far the line sweeps, in degrees. Positive arcs over, negative under. */
    curve?: number;
    fontSize: number;
    lineHeight: number;
    /** The widget's letter spacing, which it holds as a percentage of the size. */
    letterSpacing: number;
    fontFamily: string;
    fontWeight: string | number;
    fontStyle: string;
};
/**
 * Throws the measurements away, so the next arc is measured in whatever is
 * loaded by then.
 *
 * A character measured before its typeface arrives is measured in the fallback
 * one, and the wrong width would otherwise be cached against the right font's
 * name for the rest of the session.
 */
export declare function forgetMeasurements(): void;
/**
 * Works out where every character of a curved run goes.
 *
 * Returns null when there is no curve to draw or nothing to draw it with, which
 * is the caller's signal to lay the text out the ordinary way.
 */
export default function layoutCurvedText(input: TCurveInput): TCurvedLayout | null;
