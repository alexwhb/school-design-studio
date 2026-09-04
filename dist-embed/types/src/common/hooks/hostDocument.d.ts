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
};
type Options = {
    getTitle: () => string;
    onChange: ((doc: DesignDocument, meta: {
        dirty: boolean;
    }) => void) | null;
    onSave: ((doc: DesignDocument) => Promise<void>) | null;
};
/** A plain copy of what is on the canvas, free of the store's proxies. */
export declare function readDocument(title: string): DesignDocument;
export default function useHostDocument({ getTitle, onChange, onSave }: Options): HostDocument;
export {};
