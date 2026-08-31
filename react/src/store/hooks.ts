import { useSnapshot } from 'valtio'
import { baseState, canvasState, controlState, forceState, groupState, historyState, userState, widgetState } from './state'

export const useCanvasState = () => useSnapshot(canvasState)
export const useWidgetState = () => useSnapshot(widgetState)
export const useControlState = () => useSnapshot(controlState)
export const useForceState = () => useSnapshot(forceState)
export const useHistoryState = () => useSnapshot(historyState)
export const useBaseState = () => useSnapshot(baseState)
export const useUserState = () => useSnapshot(userState)
export const useGroupState = () => useSnapshot(groupState)
