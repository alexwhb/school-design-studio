/**
 * Starts the undo history again from nothing: the stack, and any press still
 * waiting to be written down.
 *
 * For when the design underneath is replaced by a different one, and for when
 * the editor mounts and unmounts. The stack lives in a module rather than in
 * the component, so without this a second editor on the same page — or the
 * same one opened again — inherited the last one's steps, and Ctrl+Z applied
 * one design's patches to another.
 */
export declare function resetHistory(): void;
/**
 * Where a change no pointer or key event brackets begins, and where it ends.
 *
 * The pair below are ordinary bubble listeners on the document, so a control
 * that stops a press from propagating — which anything laid over the canvas has
 * to, or the board underneath selects and starts dragging what the press was
 * meant for — takes its own undo entry with it. Such a control marks the two
 * ends itself: the shape tool between the press that starts a box and the
 * release that puts it on the page, a corner grip either side of the drag that
 * rounds it.
 *
 * A bracket already open is closed first, so whatever it saw is its own step
 * rather than being folded into this one or lost.
 *
 * An empty diff is not an entry, so a press that turned into nothing costs a
 * press of Ctrl+Z later.
 */
export declare function beginHistory(): void;
export declare function endHistory(): void;
/**
 * The two together, for a change that happens all at once — one committed from
 * an inline editor or a dialog, which the pair below would otherwise never see.
 */
export declare function recordHistory(change: () => void): void;
export default function useHistory(): void;
