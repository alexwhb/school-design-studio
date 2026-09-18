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
export type TBooleanOp = 'unite' | 'subtract' | 'intersect' | 'exclude'

/**
 * The kinds of widget that have an outline to combine. A photograph, a piece of
 * text, a table, a QR code and a group are not shapes — there is no closed
 * curve to hand to a boolean — so a selection holding one of them cannot be
 * combined at all, and the buttons say so by being unavailable.
 */
const OPERAND_TYPES = ['w-rect', 'w-ellipse', 'w-polygon', 'w-path', 'w-svg']

/** True when this layer can take part in a boolean operation. */
export function canCombine(widget: Record<string, any> | null | undefined): boolean {
  return !!widget && OPERAND_TYPES.includes(String(widget.type))
}
