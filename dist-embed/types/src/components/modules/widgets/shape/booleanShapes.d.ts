import type { TdWidgetData } from '../../../../store/types';
import { type TBooleanOp } from './combinable';
/**
 * The shape `operands` make under `op`, or null when they make nothing at all —
 * an intersection of two shapes that do not touch, or a subtraction that takes
 * everything away.
 *
 * `operands` must be in z-order, bottom first. Subtract is bottom minus
 * everything above it, which is what XD does and the only ordering anybody
 * predicts; the rest are order-independent as operations but are folded in the
 * same order for the same reason.
 *
 * The result inherits the **bottom-most** operand's fill, outline, opacity and
 * shadow. Every other operand's paint is lost. That is XD's rule, and it is
 * deliberate rather than incidental: the alternatives are to keep the topmost
 * one's (which is Illustrator's, and surprises anyone who came from XD) or to
 * try to blend several fills into one, which has no sensible answer. The layer
 * name goes too — the result is a new shape, and a subtraction still called
 * "Blue banner" is a worse label than "Shape".
 */
export declare function combinedShape(op: TBooleanOp, operands: readonly Record<string, any>[]): TdWidgetData | null;
