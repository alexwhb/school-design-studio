export declare function setAppRoot(element: HTMLElement | null): void;
/**
 * The element the editor treats as its own page: `#app` when it owns the tab,
 * or the container it was mounted into when it is embedded in another app.
 */
export declare function getAppRoot(): HTMLElement | null;
/**
 * Whether the editor is inside somebody else's page — mounted by the
 * `DesignStudio` component — rather than being the whole tab. Embedded, the
 * address bar, the history and the page around the editor are the host's.
 */
export declare function isEmbedded(): boolean;
/**
 * Where menus, tooltips and toasts are rendered. Standalone that is the body,
 * which is where they have always gone. Embedded it has to be the editor's own
 * root, because the embed build scopes every rule under it — anything portalled
 * to the body would come out unstyled.
 */
export declare function getPortalContainer(): HTMLElement | undefined;
/**
 * Whether a key pressed with focus on `target` is the editor's to answer.
 *
 * The shortcuts listen on the document, because focus in a design tool is
 * mostly nowhere in particular: clicking the page leaves it on the body. But
 * embedded, the document is the host's too, and they used to answer for all of
 * it — Backspace on one of the planner's buttons deleted the selected widget,
 * the arrow keys in its menus nudged it, a typeahead letter armed a drawing
 * tool, and Ctrl+A/C/V/Z in its own text fields went to the design.
 *
 * So a key counts when focus is inside the editor's root, or when it is on the
 * body or the root element, where it lands after a click on the canvas. A
 * form field or a contentEditable outside the root is the host's, and so is
 * anything else outside it. Standalone the editor is the whole page and the
 * root test passes for everything.
 *
 * Fields inside the editor — the design's name, the speaker notes — are still
 * fields and take their own keys; `isFieldTarget` is how the caller tells.
 */
export declare function isEditorKeyTarget(target: EventTarget | null | undefined): boolean;
/**
 * Whether a pointer event on `target` happened in the editor.
 *
 * Stricter than the key test: a press on the host's own page lands on its
 * body as readily as on one of its elements, and is not the editor's either
 * way.
 */
export declare function isEditorPointerTarget(target: EventTarget | null | undefined): boolean;
/** A form field, or text somebody can type into, which takes its own keys. */
export declare function isFieldTarget(target: EventTarget | null | undefined): boolean;
