/**
 * Remembers whether anything was laid over the editor when Escape went down.
 *
 * Element Plus and Radix both take Escape in the capture phase, and both have
 * the dialog or popover out of the DOM before a bubbling handler runs — so by
 * the time the editor's own shortcut handler looks, there is nothing left to
 * see, and it would drop the selection behind something the key was aimed at.
 * This looks in the same phase they do and is registered first, so it looks
 * before they close anything.
 */
export declare function watchOverlayEscape(): () => void;
/** Whether the Escape being handled now was aimed at something over the editor. */
export declare function escapeHitOverlay(): boolean;
