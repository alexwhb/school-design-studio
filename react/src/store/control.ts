import { controlState } from './state'

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
