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
