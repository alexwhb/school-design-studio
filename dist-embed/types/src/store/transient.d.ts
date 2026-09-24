/**
 * Flags a widget carries while it is being worked on, and never after.
 *
 * `editable` is written to the store while a text box or a table has the caret,
 * because the shortcuts, copy and paste and the selection box all read it to
 * tell a box being typed into from one being moved about. `cropEdit` is the
 * same for a shape being cropped. Both belong to this tab's editing session,
 * not to the design: saved, a box came back from the host still claiming the
 * caret, and on reopening it ignored Delete, the arrow keys, Ctrl+C and Ctrl+D
 * until somebody double-clicked it and clicked away again.
 *
 * So they are taken off every copy of a design that leaves the store, and off
 * every design that arrives. Nothing here imports anything, so the compose
 * entry can read it on a server.
 */
export declare const TRANSIENT_FIELDS: readonly string[];
/**
 * A `JSON.stringify` replacer that leaves out an editing flag that is set.
 *
 * Only a set one. A widget's defaults say `editable: false`, and every design
 * ever composed carries that; dropping it too would make a document read back
 * out of the editor differ from the one that went in when nothing was edited.
 */
export declare function withoutTransient(key: string, value: unknown): unknown;
/** A plain copy of some layouts, free of the store's proxies and of the editing flags. */
export declare function plainLayouts<T>(layouts: T): T;
/** Takes every set editing flag off every layer, in place. For a design on its way in. */
export declare function stripTransient(layouts: unknown): void;
