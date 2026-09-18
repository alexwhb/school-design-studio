/*
 * Wheel and pinch zoom over the board.
 *
 * Three gestures arrive here as the same `wheel` event and want different
 * things, so each is told apart before anything is cancelled:
 *
 *  - A pinch on a Mac trackpad. The system reports it as a wheel event with
 *    `ctrlKey` set and nobody touching Ctrl. Same shape as a real Ctrl+wheel,
 *    and both mean zoom, so they share a path.
 *  - A notch of a mouse wheel. Zooms, because that is what a wheel over a
 *    canvas does everywhere else.
 *  - Two fingers dragging on a trackpad. Scrolls the board, which is the only
 *    way to pan it without holding space. Zooming on this would make a trackpad
 *    unusable, which is why the two are separated rather than both zooming.
 *
 * Shift+wheel is left alone: the browser turns it into a horizontal scroll and
 * that is worth keeping.
 */

export type WheelZoom = {
  /** Multiply the zoom by `factor`, holding (clientX, clientY) still. */
  scale: (factor: number, clientX: number, clientY: number) => void
}

/** Chrome and Safari still report the legacy wheelDelta, where a notch is 120. */
type LegacyWheelEvent = WheelEvent & { wheelDeltaY?: number }

/** Safari's own pinch, which it reports instead of a Ctrl+wheel. `scale` counts from the start of the gesture. */
type GestureEvent = Event & { scale: number; clientX: number; clientY: number }

export function isMouseWheel(e: LegacyWheelEvent) {
  // Firefox has no wheelDelta, but it reports a real wheel in whole lines and a
  // trackpad in pixels.
  if (e.deltaMode !== 0) return true
  // Everywhere else a notch is exactly 120 of legacy wheelDelta, and a fast
  // spin is a multiple of it. A trackpad sends whatever the fingers did.
  if (typeof e.wheelDeltaY === 'number' && e.wheelDeltaY !== 0) {
    return Math.abs(e.wheelDeltaY) % 120 === 0
  }
  return false
}

/** One notch of the wheel. Coarse enough to be worth the gesture, fine enough to aim. */
const NOTCH = 1.18
const PINCH_RATE = 0.01
const PINCH_MIN = 0.85
const PINCH_MAX = 1.18

/** A pinch is continuous, so how far it travelled sets how far it zooms. */
function pinchFactor(deltaY: number) {
  return Math.min(PINCH_MAX, Math.max(PINCH_MIN, Math.exp(-deltaY * PINCH_RATE)))
}

export default function addWheelZoom(elementId: string, zoom: WheelZoom) {
  const box = document.getElementById(elementId)
  if (!box) return () => {}

  const onWheel = (e: LegacyWheelEvent) => {
    const pinching = e.ctrlKey || e.metaKey
    if (!pinching && (e.shiftKey || !isMouseWheel(e))) return
    // Cancelling is what stops the browser zooming the whole page out from
    // under the editor, so it has to happen for every gesture we take.
    e.preventDefault()
    zoom.scale(pinching ? pinchFactor(e.deltaY) : e.deltaY < 0 ? NOTCH : 1 / NOTCH, e.clientX, e.clientY)
  }

  // Safari reports a trackpad pinch as its own gesture events rather than a
  // Ctrl+wheel, so without these the pinch zooms the page instead of the
  // artwork. They never fire anywhere else.
  let gestureScale = 1
  const onGestureStart = (e: Event) => {
    e.preventDefault()
    gestureScale = 1
  }
  const onGestureChange = (e: Event) => {
    e.preventDefault()
    const gesture = e as GestureEvent
    const factor = gesture.scale / gestureScale
    if (!Number.isFinite(factor) || factor <= 0) return
    gestureScale = gesture.scale
    zoom.scale(Math.min(PINCH_MAX, Math.max(PINCH_MIN, factor)), gesture.clientX, gesture.clientY)
  }
  const onGestureEnd = (e: Event) => {
    e.preventDefault()
    gestureScale = 1
  }

  // Not passive: a listener that cannot call preventDefault cannot stop the
  // browser's own page zoom, and Chrome treats wheel listeners as passive by
  // default.
  box.addEventListener('wheel', onWheel, { passive: false })
  box.addEventListener('gesturestart', onGestureStart, { passive: false })
  box.addEventListener('gesturechange', onGestureChange, { passive: false })
  box.addEventListener('gestureend', onGestureEnd, { passive: false })
  return () => {
    box.removeEventListener('wheel', onWheel)
    box.removeEventListener('gesturestart', onGestureStart)
    box.removeEventListener('gesturechange', onGestureChange)
    box.removeEventListener('gestureend', onGestureEnd)
  }
}
