import { canvasState, widgetState } from './state'
import type { TGuidelinesData, TPageState, TScreeData } from './types'

export function updateZoom(zoom: number) {
  canvasState.dZoom = zoom
}

export function updatePaddingTop(num: number) {
  canvasState.dPaddingTop = num
}

export function updateScreen({ width, height }: TScreeData) {
  canvasState.dScreen.width = width
  canvasState.dScreen.height = height
}

export function updateGuidelines(lines: Partial<TGuidelinesData>) {
  canvasState.guidelines = { ...canvasState.guidelines, ...lines }
}

export function reChangeCanvas() {}

export function updatePageData<T extends keyof TPageState>({ key, value }: { key: T; value: TPageState[T] }) {
  const data = canvasState.dPage
  if (data[key] !== value) {
    data[key] = value
  }
}

export function getDPage() {
  return widgetState.dLayouts[canvasState.dCurrentPage].global
}

export function setDPage(data: TPageState) {
  canvasState.dPage = data
  updateDPage()
}

export function updateDPage() {
  widgetState.dLayouts[canvasState.dCurrentPage].global = canvasState.dPage
}

export function setBottomHeight(h: number) {
  canvasState.dBottomHeight = h
}

export function setDCurrentPage(n: number) {
  canvasState.dCurrentPage = n
}
