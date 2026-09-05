import type { DesignKind } from '../compose/types';
export declare const documentKindState: {
    kind: DesignKind | null;
};
/** The template categories each kind offers. `null` offers all of them. */
export declare const KIND_CATEGORIES: Record<DesignKind, string[]>;
/** Whether this design is one somebody stands up and presents. */
export declare function isPresentable(): boolean;
/**
 * Sets the kind, and the page size that goes with it.
 *
 * Only on a blank canvas: a design that already has artwork on it has a size
 * somebody chose, and resizing it out from under them is what the Resize dialog
 * is for. The page object is shared between the canvas store and the first
 * layout, so writing to it once is enough.
 */
export declare function setDocumentKind(kind: DesignKind | null): void;
