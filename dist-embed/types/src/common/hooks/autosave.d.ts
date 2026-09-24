/**
 * Where the design stands with the store, for the pill in the toolbar. Saving
 * is quiet and debounced, so without this the only way to know whether your
 * work is safe is to close the tab and see whether the browser objects.
 *
 * `idle` is before any of it is running — the design is still being loaded, and
 * saying either "Saved" or "Unsaved" then would be a guess. `error` is only
 * reachable when a host is doing the saving: a write to IndexedDB that fails
 * leaves the design unsaved rather than failed, and says so in a message.
 */
export type SaveStatus = 'idle' | 'saved' | 'unsaved' | 'saving' | 'error';
export declare const autosaveState: {
    status: SaveStatus;
};
type TOptions = {
    /** Reads the design's name, which lives in the toolbar's own state. */
    getTitle: () => string;
    /** Puts a restored name back into the toolbar. */
    setTitle: (title: string) => void;
};
export type Autosave = {
    restoreThenWatch: (isBlankEditor: boolean) => Promise<void>;
    saveNow: () => Promise<void>;
    isDirty: () => boolean;
    /** Call when something outside the widget store changes, such as the title. */
    schedule: () => void;
};
export default function useAutosave({ getTitle, setTitle }: TOptions): Autosave;
export {};
