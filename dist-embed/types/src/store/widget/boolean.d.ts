import { type TBooleanOp } from '../../components/modules/widgets/shape/combinable';
/**
 * Fetches the geometry, and paper.js along with it.
 *
 * paper is ninety kilobytes of bezier arithmetic, and the overwhelming majority
 * of sessions never combine anything, so it is not in the bundle a design page
 * loads — it arrives on the first press of one of the four buttons and is held
 * for the rest of the session.
 *
 * It has to be awaited *before* `combineShapes`, not inside it, because
 * `recordHistory` is synchronous: it snapshots the page, calls, and snapshots
 * again. An await in the middle would close the undo step before the shapes had
 * moved, and the operation would not be undoable.
 */
export declare function loadCombine(): Promise<void>;
/**
 * Replaces the selected shapes with the one they make under `op`.
 *
 * Nothing happens, and nothing is written to the undo stack, when the selection
 * cannot be combined or when the operation leaves no shape behind — two circles
 * that do not touch have no intersection, and a shape subtracted from itself
 * has nothing left. Both say so rather than emptying the page.
 */
export declare function combineShapes(op: TBooleanOp): void;
