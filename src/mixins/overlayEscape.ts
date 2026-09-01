/** Anything laid over the editor that takes Escape for itself. */
const overlays = '.el-overlay, .el-popper, [data-radix-popper-content-wrapper], [role="dialog"]'

let hitOverlay = false

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
export function watchOverlayEscape() {
  const onKeyDownCapture = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return
    hitOverlay = !!document.querySelector(overlays)
  }
  document.addEventListener('keydown', onKeyDownCapture, true)
  return () => document.removeEventListener('keydown', onKeyDownCapture, true)
}

/** Whether the Escape being handled now was aimed at something over the editor. */
export function escapeHitOverlay() {
  return hitOverlay
}
