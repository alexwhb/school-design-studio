import { canvasState, controlState, historyState, widgetState } from '../state'

export type TSelectWidgetData = {
  uuid: string
}

export function selectWidget({ uuid }: TSelectWidgetData) {
  const alt = controlState.dAltDown
  const selectWidgets = widgetState.dSelectWidgets
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)

  if (alt) {
    if (!widget) return
    if (uuid !== '-1' && widget.parent === '-1') {
      if (selectWidgets.length === 0) {
        if (widgetState.dActiveElement && widgetState.dActiveElement.uuid !== '-1') {
          selectWidgets.push(widgetState.dActiveElement)
        }
      }
      const index = selectWidgets.findIndex((item) => item.uuid === uuid)
      if (index !== -1) {
        selectWidgets.splice(index, 1)
        if (selectWidgets.length === 0) {
          widgetState.dActiveElement = canvasState.dPage
        }
      } else {
        selectWidgets.push(widget)
      }
      if (selectWidgets.length === 1) {
        widgetState.dActiveElement = selectWidgets[0]
        widgetState.dSelectWidgets = []
      }
    }
    return
  }
  widgetState.dSelectWidgets = []
  if (uuid === '-1') {
    widgetState.dActiveElement = canvasState.dPage
    const pageHistory = historyState.dPageHistory
    if (pageHistory.length === 0) {
      pageHistory.push(JSON.stringify(canvasState.dPage))
    }
    setTimeout(() => {
      widgetState.dSelectWidgets = []
    }, 10)
  } else {
    if (!widget) return
    setTimeout(() => {
      widgetState.dActiveElement = widget
    }, 10)
  }
}

export function selectWidgetsInOut({ uuid }: TSelectWidgetData) {
  const selectWidgets = widgetState.dSelectWidgets
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (widget && uuid !== '-1' && widget.parent === '-1' && !widget.isContainer) {
    if (selectWidgets.length === 0) {
      if (widgetState.dActiveElement && widgetState.dActiveElement.uuid !== '-1') {
        selectWidgets.push(widgetState.dActiveElement)
      }
    }
    const index = selectWidgets.findIndex((item) => item.uuid === uuid)
    if (index !== -1) {
      selectWidgets.splice(index, 1)
      if (selectWidgets.length === 0) {
        widgetState.dActiveElement = canvasState.dPage
      }
    } else {
      selectWidgets.push(widget)
    }
  }
}

export type TselectItem = {
  data?: Record<string, any> | null
  type?: string
}

export function setSelectItem({ data, type }: TselectItem) {
  widgetState.selectItem.data = data
  widgetState.selectItem.type = type
}

/**
 * Ctrl/Cmd + A. Takes every top-level layer on the page as the selection —
 * a group counts as one thing, so its container comes in and its children stay
 * out, and locked layers are left alone the same way a drag box leaves them.
 *
 * A single layer is made active rather than multi-selected: that is what one
 * click does, and the panels read the two states differently.
 */
export function selectAllWidgets() {
  const selectable = widgetState.dWidgets.filter((item) => item.parent === '-1' && !item.lock)
  if (selectable.length === 0) return
  if (selectable.length === 1) {
    widgetState.dSelectWidgets = []
    widgetState.dActiveElement = selectable[0]
    return
  }
  widgetState.dSelectWidgets = selectable
}
