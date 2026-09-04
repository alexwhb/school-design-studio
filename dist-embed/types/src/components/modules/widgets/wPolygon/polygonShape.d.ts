/**
 * The outline of a drawn polygon: how many corners it has, and where they land.
 *
 * One number describes the whole shape — `sides`, three for a triangle and up
 * to a hundred, at which point it is a circle in all but name. Everything that
 * draws a polygon reads it through `readSides`, so a widget carrying nothing, a
 * widget carrying a decimal from a hand-edited design, and a widget carrying a
 * count larger than the shape can hold all come out as a whole number in range
 * rather than a path the browser refuses.
 *
 * The corners themselves are the vertices of a regular polygon — evenly spaced
 * on a circle, first one straight up, going clockwise — and then stretched to
 * fill the box exactly. Stretching is what makes a drawn shape land where it
 * was dragged: the raw circle touches the box at the vertices and nowhere else,
 * so a triangle drawn across a 400×300 frame would come out 346 wide and sat in
 * the top three-quarters of it, which is not the shape anybody pulled out. It
 * also means a polygon behaves like every other widget under a resize handle —
 * whatever it is stretched to, it fills.
 *
 * The trade is that only 3, 4 and the even counts stay equilateral once
 * stretched, which is exactly the trade Adobe XD makes, and for the same
 * reason: what you drag is what you get.
 */
/** Three is a triangle; below it there is no shape to draw. */
export declare const MIN_SIDES = 3;
/**
 * A hundred, past which one more corner moves the outline by less than the
 * screen can show and the shape is a circle either way.
 */
export declare const MAX_SIDES = 100;
/** How many corners a polygon actually draws, whatever it is carrying. */
export declare function readSides(params: Record<string, any> | null | undefined): number;
/** The same corners as an SVG `d`, closed so the last edge is drawn too. */
export declare function polygonPath(width: number, height: number, sides: number): string;
