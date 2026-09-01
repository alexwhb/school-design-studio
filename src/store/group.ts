import { customAlphabet } from 'nanoid/non-secure'
import { canvasState, groupState, widgetState } from './state'
import type { TdWidgetData } from './types'

const nanoid = customAlphabet('1234567890abcdef', 12)

export function realCombined() {
  const selectWidgets = widgetState.dSelectWidgets
  if (selectWidgets.length > 1) {
    const widgets = widgetState.dWidgets
    const group: TdWidgetData = JSON.parse(groupState.dGroupJson)
    group.uuid = nanoid()
    widgets.push(group)
    let left = Number(canvasState.dPage.width)
    let top = Number(canvasState.dPage.height)
    let right = 0
    let bottom = 0
    const sortWidgets: TdWidgetData[] = []
    const selectkeys = selectWidgets.map((x) => x.uuid)
    for (const w of widgets) {
      selectkeys.includes(w.uuid) && sortWidgets.push(w)
    }
    for (let i = 0; i < sortWidgets.length; ++i) {
      const uuid = sortWidgets[i].uuid
      const index = widgets.findIndex((item) => item.uuid === uuid)
      const widget = { ...widgets[index] }
      if (widget.isContainer) {
        widgets.splice(index, 1)
        for (let j = 0; j < widgets.length; j++) {
          const item = widgets[j]
          item.parent === widget.uuid && (item.parent = group.uuid)
        }
      } else {
        widget.parent = group.uuid
        widgets.splice(index, 1)
        widgets.push(widget)
      }

      left = Math.min(left, widget.left)
      top = Math.min(top, widget.top)
      right = Math.max(right, Number(widget.width || widget.record?.width || 0) + Number(widget.left))
      bottom = Math.max(bottom, Number(widget.height || widget.record?.height || 0) + Number(widget.top))
    }

    group.left = Number(left)
    group.top = Number(top)
    group.width = Number(right - left)
    group.height = Number(bottom - top)
    widgetState.dActiveElement = group
    widgetState.dSelectWidgets = []
  }
}

export function getCombined(): Promise<TdWidgetData> {
  const selectWidgets = widgetState.dSelectWidgets
  return new Promise((resolve) => {
    if (selectWidgets.length > 1) {
      const widgets = widgetState.dWidgets
      const group = JSON.parse(groupState.dGroupJson)
      group.uuid = nanoid()
      let left = canvasState.dPage.width
      let top = canvasState.dPage.height
      let right = 0
      let bottom = 0
      const sortWidgets: TdWidgetData[] = []
      const selectkeys = selectWidgets.map((x) => x.uuid)
      for (const w of widgets) {
        selectkeys.includes(w.uuid) && sortWidgets.push(w)
      }
      for (let i = 0; i < sortWidgets.length; ++i) {
        const uuid = sortWidgets[i].uuid
        const index = widgets.findIndex((item) => item.uuid === uuid)
        const widget = { ...widgets[index] }
        left = Math.min(left, widget.left)
        top = Math.min(top, widget.top)
        right = Math.max(right, Number(widget.width) + Number(widget.left))
        bottom = Math.max(bottom, Number(widget.height) + Number(widget.top))
      }

      group.left = left
      group.top = top
      group.width = right - left
      group.height = bottom - top

      resolve(group)
    }
  })
}

export function initGroupJson(json: string) {
  groupState.dGroupJson = json
}
