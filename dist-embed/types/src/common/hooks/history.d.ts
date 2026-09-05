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
