import { widgetState } from '../state'
import { setUpdateSelect } from '../force'
import type { TdWidgetData } from '../types'
import { clearSelection } from './select'

export type TupdateLayerIndexData = {
  uuid: string
  value: number
  isGroup?: boolean
}

export function updateLayerIndex({ uuid, value, isGroup }: TupdateLayerIndexData) {
  const widgets = widgetState.dWidgets
  const widget = widgets.find((item) => item.uuid === uuid)
  const index = widgets.findIndex((item) => item.uuid === uuid)
  let group: TdWidgetData[] = []

  if (!widget) return

  if (isGroup) {
    group = widgets.filter((item) => item.parent === uuid)
    for (let i = 0; i < group.length; ++i) {
      const pos = widgets.findIndex((item) => item.uuid === group[i].uuid)
      widgets.splice(pos, 1)
    }
  }

  let next = index + value
  let move = false
  const maxLen = widgets.length
  let gCount = 1
  while (next >= 0 && next < maxLen) {
    const nextWidget = widgets[next]
    if (widget.parent !== '-1') {
      if (nextWidget.parent === widget.parent) {
        widgets.splice(index, 1)
        widgets.splice(next, 0, widget)
        move = true
      }
      break
    } else if (nextWidget.parent === '-1') {
      if ((gCount === 0 && nextWidget.isContainer) || !nextWidget.isContainer || (value < 0 && nextWidget.isContainer)) {
        if (gCount === 0 && value > 0) {
          next -= value
        }
        widgets.splice(index, 1)
        widgets.splice(next, 0, widget)
        move = true
        break
      } else if (nextWidget.isContainer) {
        gCount = 0
      }
    }
    next += value
  }
  next -= value
  if (!move && next !== index) {
    widgets.splice(index, 1)
    widgets.splice(next, 0, widget)
  }

  if (isGroup) {
    const pos = widgets.findIndex((item) => item.uuid === uuid)
    for (let i = group.length - 1; i >= 0; --i) {
      widgets.splice(pos + 1, 0, group[i])
    }
  }
}

export function ungroup(uuid: string) {
  const widgets = widgetState.dWidgets
  const index = widgets.findIndex((item) => item.uuid === uuid)
  widgets.splice(index, 1)
  const len = widgets.length

  for (let i = 0; i < len; ++i) {
    if (widgets[i].parent === uuid) {
      widgets[i].parent = '-1'
      widgetState.dSelectWidgets.push(widgets[i])
    }
  }

  setUpdateSelect()
}

export type TsetLayerHiddenData = {
  uuid: string
  hidden: boolean
}

/**
 * Takes a layer off the canvas, or puts it back.
 *
 * A hidden layer is not rendered at all rather than merely made transparent,
 * so it cannot be clicked, snapped to, or picked up by a drag selection, and
 * every export that draws the page simply never sees it.
 */
export function setLayerHidden({ uuid, hidden }: TsetLayerHiddenData) {
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (!widget) return
  if (!hidden) {
    delete widget.hidden
    return
  }
  widget.hidden = true
  // Nothing is left on the canvas for a selection box to hold on to, so let go
  // of the layer as it goes — and of a child that went with its group.
  const active = widgetState.dActiveElement
  const wasSelected = widgetState.dSelectWidgets.some((item) => item.uuid === uuid || item.parent === uuid)
  if (wasSelected || active?.uuid === uuid || active?.parent === uuid) {
    clearSelection()
  }
}
