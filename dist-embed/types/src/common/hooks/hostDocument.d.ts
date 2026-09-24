import type { DesignDocument } from '../../compose/types';
export type HostDocument = {
    /** True when the canvas has moved on from the last save. */
    isDirty: () => boolean;
    /** Save now: the toolbar button, and Cmd/Ctrl-S. */
    saveNow: () => Promise<void>;
    /** Call when something outside the widget store changes, such as the title. */
    schedule: () => void;
    /** Start watching, with what is on the canvas as the baseline. */
    start: () => void;
    /** After the host replaces the document wholesale, this is the new baseline. */
    rebase: () => void;
    /**
     * The host saved a design on its own account. `doc` is what it saved, or the
     * canvas when left out; either way it is now what "unsaved" measures
     * against. The canvas and the undo history are not touched.
     */
    markSaved: (doc?: DesignDocument) => void;
};
type Options = {
    getTitle: () => string;
    onChange: ((doc: DesignDocument, meta: {
        dirty: boolean;
    }) => void) | null;
    onSave: ((doc: DesignDocument) => Promise<void>) | null;
};
/**
 * A plain copy of what is on the canvas, free of the store's proxies and of
 * the flags that only mean something while a box is being edited.
 *
 * Words still being typed are stored first, so what comes out is what is on
 * the screen rather than what was there when the caret went in — unless the
 * caller says not to, which only the quiet-time report does.
 */
export declare function readDocument(title: string, { commit }?: {
    commit?: boolean;
}): DesignDocument;
export default function useHostDocument({ getTitle, onChange, onSave }: Options): HostDocument;
/**
 * The keeper itself, outside React so it can be driven on its own. The hook
 * above holds one per editor and hands it the latest options through a ref.
 */
export declare function createHostDocument(options: {
    current: Options;
}): HostDocument & {
    dispose: () => void;
};
export {};
