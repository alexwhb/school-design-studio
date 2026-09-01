import { forceState } from './state'

export function setZoomScreenChange() {
  forceState.zoomScreenChange = Math.random()
}

export function setUpdateRect() {
  forceState.updateRect = Math.random()
}

export function setUpdateSelect() {
  forceState.updateSelect = Math.random()
}

/**
 * Undo, redo and restoring an autosave swap dLayouts for a freshly parsed copy.
 * Every widget is then a new object holding the same values, which is exactly
 * the change valtio's snapshot comparison is built to ignore: the board would
 * go on rendering the old, now detached, objects and an undone rotation would
 * stay on screen. This says the list itself is new and has to be read again.
 */
export function setLayoutsChange() {
  forceState.layoutsChange = Math.random()
}
