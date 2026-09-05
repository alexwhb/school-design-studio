import { type TBrandKit } from './brandKitCore';
import type { TFieldResolver } from '../../utils/mergeFieldsCore';
export * from './brandKitCore';
export declare const brandState: {
    kit: TBrandKit;
    loaded: boolean;
    readOnly: boolean;
};
/**
 * Whether the kit may be edited here.
 *
 * A school's brand belongs to the school, not to whoever happens to have a
 * design open, so a planner can hand the kit in for everyone to use and let
 * only an administrator change it. The panel greys itself out, but the answer
 * that matters is `updateBrandKit` below refusing: a guard at the one writer
 * cannot be got round by a control somebody forgot to disable.
 */
export declare function setBrandReadOnly(readOnly: boolean): void;
/**
 * Answers `school.*` fields, from the editor's live kit when no other is named.
 * The core's own `brandResolver` takes a kit outright, because nothing outside
 * a browser has a live one to fall back to.
 */
export declare function brandResolver(kit?: TBrandKit): TFieldResolver;
/** A plain copy, free of the store's proxies, for the database and the host. */
export declare function snapshotBrandKit(): TBrandKit;
/**
 * Reads the kit in, once, when the editor starts.
 *
 * With `initial` the host owns the kit: it is used as given, every later save
 * goes to `onChange` and the database is left alone. Without it the kit comes
 * from the browser, and a browser that has never had one gets an empty kit.
 * Never throws — a kit that cannot be read is an empty kit, not a dead editor.
 */
export declare function loadBrandKit(initial?: TBrandKit, onChange?: (kit: TBrandKit) => void): Promise<void>;
/**
 * Takes a kit the host has changed since the editor mounted. Compared as JSON
 * first, because a host that builds the prop inline hands over a new object on
 * every render, and replacing the kit for each of those would throw away what
 * is being typed in the panel.
 */
export declare function adoptBrandKit(kit: TBrandKit): void;
/** Writes the kit down now. Resolves false when the browser would not take it. */
export declare function saveBrandKit(): Promise<boolean>;
/** Writes anything still waiting, which a tab about to be hidden should. */
export declare function flushBrandKit(): Promise<boolean>;
/**
 * Changes the kit and schedules the write. Every edit in the panel goes
 * through here so that typing a name is one write rather than one per letter.
 */
export declare function updateBrandKit(change: (kit: TBrandKit) => void): void;
