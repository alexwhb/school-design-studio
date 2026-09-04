import { type ReactNode } from 'react';
import { type EditorMode } from './common/hooks/useEditorMode';
import { type DesignStudioHandle, type HostUploads } from './common/hooks/hostApi';
import { type TBrandKit } from './common/methods/brandKit';
import { type DesignStudioConfig } from './config';
import type { DesignDocument, DesignKind } from './compose/types';
import './assets/styles/embed';
export type DesignStudioProps = {
    /** Which of the editor's screens to show. Defaults to the full editor. */
    mode?: EditorMode;
    /**
     * Where the editor's read-only content endpoints live. Leave empty when the
     * host answers `/design/*` on its own origin.
     */
    apiUrl?: string;
    /** Where the app name in the toolbar links back to. */
    homeUrl?: string;
    /** Name shown in the toolbar. */
    appName?: string;
    /** Anything else from the editor's config that the host wants to override. */
    config?: DesignStudioConfig;
    /**
     * Appearance. `host` follows whatever the surrounding app has set on <html>,
     * which is what you want when the planner already has a theme switcher.
     */
    theme?: 'light' | 'dark' | 'host';
    /**
     * The school's brand kit, when the host keeps it. Given, it is used as it is
     * and the browser's own copy is left alone; every change made in the Brand
     * panel is then reported through `onBrandChange`, and it is the host's job
     * to store it. Left out, the kit lives in the browser's IndexedDB.
     */
    brand?: TBrandKit;
    onBrandChange?: (kit: TBrandKit) => void;
    /**
     * The design to edit, when the host keeps it.
     *
     * Given, the editor stops keeping designs of its own: nothing is written to
     * IndexedDB, the "pick up where you left off?" offer never appears, and this
     * document is where undo stops going back. Changes come out through
     * `onDocumentChange` and `onSave`. Changing the prop later is *not* followed
     * — a design is not a setting, and swapping it out from under somebody
     * mid-sentence would lose what they were typing. Use the ref's `setDocument`,
     * which is an explicit act.
     */
    document?: DesignDocument;
    /**
     * What is being made. Sets the page size a blank design starts at, narrows
     * the template gallery to templates of that sort, and takes the presenter and
     * the speaker notes away from a poster, which nobody stands up and presents.
     */
    documentKind?: DesignKind;
    /**
     * Called after a second of quiet with the whole document, so a host can keep
     * a draft without a save. `dirty` says whether it differs from the last
     * successful save.
     */
    onDocumentChange?: (doc: DesignDocument, meta: {
        dirty: boolean;
    }) => void;
    /**
     * Puts a Save in the toolbar, and answers Cmd/Ctrl-S. The pill beside the
     * design's name follows the promise: Saving…, then Saved, or Couldn't save.
     * After a save that resolved, `isDirty()` is false.
     */
    onSave?: (doc: DesignDocument) => Promise<void>;
    /** What that button says. */
    saveLabel?: string;
    /**
     * The host's own file store, for the Uploads section of the Photos panel.
     * Given, the browser's own store is neither read nor written.
     */
    uploads?: HostUploads;
    /**
     * A panel of the host's own, shown behind an "AI" tab at the top of the left
     * rail. The studio renders it at panel width and passes it nothing: whatever
     * it wants to do to the design it does through `ref`.
     */
    assistant?: ReactNode;
    /** Drives the editor from outside. See `DesignStudioHandle`. */
    ref?: React.Ref<DesignStudioHandle>;
    className?: string;
    style?: React.CSSProperties;
};
export default function DesignStudio({ mode, apiUrl, homeUrl, appName, config, theme, brand, onBrandChange, document: hostDocument, documentKind, onDocumentChange, onSave, saveLabel, uploads, assistant, ref, className, style }: DesignStudioProps): import("react").JSX.Element;
