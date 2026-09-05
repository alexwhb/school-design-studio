/**
 * Which layers a boolean operation can be run on, and what the four operations
 * are called.
 *
 * This is apart from booleanShapes.ts, which holds the geometry, for one
 * reason: the geometry imports paper.js, and the panel needs to know whether to
 * grey the Combine row out on every selection change. Were the two in one file,
 * every design page would load ninety kilobytes of bezier arithmetic in order
 * to ask whether a rectangle is a shape. See `loadCombine` in
 * store/widget/boolean.ts for the other half of that arrangement.
 */
/** The four operations, named as paper.js names them and as XD arranges them. */
export type TBooleanOp = 'unite' | 'subtract' | 'intersect' | 'exclude';
/** True when this layer can take part in a boolean operation. */
export declare function canCombine(widget: Record<string, any> | null | undefined): boolean;
