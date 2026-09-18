/**
 * The six changes a host — or a model working for one — may make to a design.
 *
 * Deliberately small. A model that can move any widget by any number of pixels
 * will, and the result is a page nobody would print; a model that can only
 * change the words, swap a picture, and add, remove or reorder a page cannot
 * break a layout that was composed for it. The interesting work stays on this
 * side, in `deck.ts` and `poster.ts`.
 *
 * Nothing here throws. An op naming an id that is not on the page, or an index
 * off the end, comes back in `rejected` with the reason — a model handed an
 * exception learns nothing, and a half-applied batch is worse than a refused
 * one. Everything an op does not name is left exactly as it was.
 */
import type { DesignDocument, DesignOp, RejectedOp } from './types';
import type { TBrandKit } from '../common/methods/brandKitCore';
/** The `kind` values `addPage` will take, for a design of this sort. */
export declare function pageKinds(kind: 'slides' | 'poster'): string[];
export declare function applyOps(doc: DesignDocument, ops: DesignOp[], options?: {
    brand?: TBrandKit;
}): {
    doc: DesignDocument;
    rejected: RejectedOp[];
};
