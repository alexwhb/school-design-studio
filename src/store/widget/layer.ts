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

export type TLayerOrderEnd = 'front' | 'back'

/**
 * Puts a layer at the very top of the stack, or the very bottom, in one move.
 *
 * Bring forward / send backward step one place at a time, which is what you
 * want for a caption that has to sit just above one photo; this is for the
 * background that has to go behind everything, or the badge that has to come
 * out on top of all of it. A group travels as one thing: its members move with
 * it and stay in the order they were in. A member of a group can only go to
 * the top or bottom of that group, the same limit the single steps observe.
 */
export function setLayerOrder({ uuid, to }: { uuid: string; to: TLayerOrderEnd }) {
  const widgets = widgetState.dWidgets
  const index = widgets.findIndex((item) => item.uuid === uuid)
  if (index === -1) return
  const widget = widgets[index]

  // Everything that moves, in the order it currently sits
  const moving = [widget, ...widgets.filter((item) => item.parent === uuid)]
  const movingIds = new Set(moving.map((item) => item.uuid))
  const rest = widgets.filter((item) => !movingIds.has(item.uuid))

  let at: number
  if (widget.parent !== '-1') {
    // Among its siblings only: the group's own entry sits just before them
    const siblings = rest.map((item, i) => (item.parent === widget.parent ? i : -1)).filter((i) => i !== -1)
    if (siblings.length === 0) {
      at = rest.findIndex((item) => item.uuid === widget.parent) + 1
    } else {
      at = to === 'front' ? siblings[siblings.length - 1] + 1 : siblings[0]
    }
  } else {
    at = to === 'front' ? rest.length : 0
  }

  rest.splice(at, 0, ...moving)
  if (rest.every((item, i) => item === widgets[i])) return
  widgets.splice(0, widgets.length, ...rest)
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
