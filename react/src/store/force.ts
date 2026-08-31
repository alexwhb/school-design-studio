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
