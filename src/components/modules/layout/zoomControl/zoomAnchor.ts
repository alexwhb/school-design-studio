/**
 * Keeps the point under the pointer under the pointer while the zoom changes.
 *
 * The board is laid out, not transformed as a whole: `.out-page` grows with the
 * zoom, `#page-design` re-centres it, `autoFixTop` rewrites the top padding,
 * and the artwork itself is scaled about an origin that flips between `left`
 * and `center` at 100%. Deriving the new scroll offset from all of that is a
 * pile of arithmetic that goes wrong the moment any of it changes, so instead
 * we record where the pointer sits in design coordinates before the zoom and
 * measure the board again afterwards to put it back.
 *
 * "Afterwards" has to be after React has committed the new sizes and before the
 * browser paints, or the board visibly jumps for a frame: `apply` is called
 * from a layout effect in ZoomControl.
 */

let pending: { designX: number; designY: number; clientX: number; clientY: number } | null = null

function board() {
  const scroller = document.getElementById('main')
  const canvas = document.getElementById('page-design-canvas')
  if (!scroller || !canvas) return null
  const rect = canvas.getBoundingClientRect()
  // The artwork is sized in design pixels and scaled by a transform, so the
  // layout width is the design width and the drawn width carries the zoom.
  const scale = canvas.offsetWidth > 0 ? rect.width / canvas.offsetWidth : 0
  return { scroller, rect, scale }
}

/** Records the design point currently under (clientX, clientY). */
export function capture(clientX: number, clientY: number) {
  const els = board()
  if (!els || els.scale <= 0) {
    pending = null
    return
  }
  pending = {
    designX: (clientX - els.rect.left) / els.scale,
    designY: (clientY - els.rect.top) / els.scale,
    clientX,
    clientY,
  }
}

/** Anchors on the middle of the board — what a keyboard or button zoom wants. */
export function captureCentre() {
  const scroller = document.getElementById('main')
  if (!scroller) {
    pending = null
    return
  }
  const rect = scroller.getBoundingClientRect()
  capture(rect.left + rect.width / 2, rect.top + rect.height / 2)
}

/** Scrolls the recorded design point back under the pointer. A no-op if nothing is pending. */
export function apply() {
  const anchor = pending
  pending = null
  if (!anchor) return
  const els = board()
  if (!els || els.scale <= 0) return
  const wantLeft = anchor.clientX - anchor.designX * els.scale
  const wantTop = anchor.clientY - anchor.designY * els.scale
  // scrollLeft/scrollTop clamp themselves at the ends of the content, which is
  // what we want: an anchor that has fallen off a page nobody can scroll to any
  // more just lands at the edge.
  els.scroller.scrollLeft += els.rect.left - wantLeft
  els.scroller.scrollTop += els.rect.top - wantTop
}

export function clear() {
  pending = null
}
