import type { TdLayout } from '../../store/types';
export type LocalDesign = {
    id: string;
    title: string;
    /** Every page, exactly as the widget store holds them. */
    layouts: TdLayout[];
    /** ISO timestamp of the last write. */
    savedAt: string;
};
/** A page the caller has decided is different from what is stored. */
export type ChangedPage = {
    index: number;
    layout: TdLayout;
};
export declare function readDraft(): Promise<LocalDesign | null>;
/**
 * Writes the title, the page count, and the pages that changed.
 *
 * `changed` must be plain data, not the widget store's own objects: IndexedDB
 * structured-clones what it is given, and the valtio store carries reactive
 * proxies that clone rejects with DataCloneError. The caller has usually just
 * been through JSON to decide which pages moved, so it holds plain copies
 * already and cloning again here would only double the work.
 *
 * `pageCount` is the whole design's length, not `changed`'s: pages past it are
 * deleted, which is how a design that lost its last page stops being restored
 * with it still attached.
 */
export declare function saveDraft(title: string, changed: ChangedPage[], pageCount: number): Promise<boolean>;
export declare function clearDraft(): Promise<void>;
/** "2 minutes ago", for telling someone how old the design we found is. */
export declare function describeAge(iso: string): string;
