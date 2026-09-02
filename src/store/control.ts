import { SNAP_STORAGE_KEY, controlState } from './state'
import type { TControlState } from './types'

export function setdMoving(bool: boolean) {
  controlState.dMoving = bool
}

export function setDraging(drag: boolean) {
  controlState.dDraging = drag
}

export function setdResizeing(bool: boolean) {
  controlState.dResizeing = bool
}

export function showRefLine(show: boolean) {
  controlState.dShowRefLine = show
}

export function setShowMoveable(show: boolean) {
  controlState.showMoveable = show
}

export function setShowRotatable(e: boolean) {
  controlState.showRotatable = e
}

export function updateAltDown(e: boolean) {
  controlState.dAltDown = e
}

export function stopDResize() {
  controlState.dResizeing = false
}

export function stopDMove() {
  controlState.dMoving = false
}

export function setCropUuid(uuid: string) {
  controlState.dCropUuid = uuid
}

/**
 * Turns a path's points on for editing, or hands it back to the selection box.
 *
 * The two cannot both be on screen. A path's points lie on its own bounds by
 * definition — that is what the bounds are — so the corner and edge points sit
 * exactly under the selection box's resize handles, and whichever was drawn
 * last would take every press meant for the other. Adobe XD answers this the
 * same way: double-clicking a path swaps the box for its points, and leaving
 * swaps them back.
 */
export function setPathEditUuid(uuid: string) {
  // Left early so that leaving a mode nothing was in cannot put the selection
  // box back over something that has just had it taken away.
  if (controlState.dPathEditUuid === uuid) return
  controlState.dPathEditUuid = uuid
  setShowMoveable(uuid === '-1')
}

export function setSpaceDown(val: boolean) {
  controlState.dSpaceDown = val
}

export function setSnapEnabled(enabled: boolean) {
  controlState.dSnapEnabled = enabled
  try {
    // Stored as a word rather than a boolean so an older build, which knows
    // nothing of this key, still reads the default.
    localStorage.setItem(SNAP_STORAGE_KEY, enabled ? 'on' : 'off')
  } catch {
    /* see readStoredSnap */
  }
}

export function toggleSnapEnabled() {
  setSnapEnabled(!controlState.dSnapEnabled)
}

/**
 * Arms a shape tool, or puts the pointer back. Nothing else is allowed to be
 * mid-flight while a tool is armed: what the tool draws becomes the selection.
 */
export function setDrawTool(tool: TControlState['dDrawTool']) {
  controlState.dDrawTool = tool
}

export function toggleDrawTool(tool: NonNullable<TControlState['dDrawTool']>) {
  setDrawTool(controlState.dDrawTool === tool ? null : tool)
}
