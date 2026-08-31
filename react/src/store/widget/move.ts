import { canvasState, controlState, widgetState } from '../state'
import type { TdWidgetData } from '../types'

export type TInidDMovePayload = {
  startX: number
  startY: number
  originX: number
  originY: number
}

export type TMovePayload = {
  donotMove?: boolean
  x: number
  y: number
}

export function initDMove(payload: TInidDMovePayload) {
  widgetState.dMouseXY.x = payload.startX
  widgetState.dMouseXY.y = payload.startY
  widgetState.dActiveWidgetXY.x = payload.originX
  widgetState.dActiveWidgetXY.y = payload.originY
}

export function dMove(payload: TMovePayload) {
  const page = canvasState.dPage
  const { donotMove } = payload
  controlState.dMoving = true

  const target = widgetState.dActiveElement
  const mouseXY = widgetState.dMouseXY
  const widgetXY = widgetState.dActiveWidgetXY

  let parent: any = page
  if (!target) return
  const record = target.record
  if (!record) return
  if (target.parent !== '-1') {
    const widget = widgetState.dWidgets.find((item) => item.uuid === target.parent)
    if (widget) {
      parent = widget
    }
  }

  const dx = payload.x - mouseXY.x
  const dy = payload.y - mouseXY.y
  let left = widgetXY.x + Math.floor((dx * 100) / canvasState.dZoom)
  let top = widgetXY.y + Math.floor((dy * 100) / canvasState.dZoom)

  left = Math.max(Math.min(left, page.width - record.width), 0)
  top = Math.max(Math.min(top, page.height - record.height), 0)

  if (target.isContainer) {
    const dLeft = target.left - left
    const dTop = target.top - top
    const len = widgetState.dWidgets.length
    for (let i = 0; i < len; ++i) {
      const widget = widgetState.dWidgets[i]
      if (widget.parent === target.uuid) {
        widget.left -= dLeft
        widget.top -= dTop
      }
    }
  }

  if (!donotMove) {
    target.left = left
    target.top = top
  }

  if (parent.uuid !== '-1') {
    updateGroupSize(parent.uuid)
  }
}

export function updateGroupSize(uuid: string) {
  const widgets = widgetState.dWidgets
  const group = widgets.find((item) => item.uuid === uuid)
  if (!group) return
  let left = canvasState.dPage.width
  let top = canvasState.dPage.height
  let right = 0
  let bottom = 0
  for (let i = 0; i < widgets.length; ++i) {
    if (widgets[i].parent === group.uuid) {
      left = Math.min(left, widgets[i].left)
      top = Math.min(top, widgets[i].top)
      right = Math.max(right, (widgets[i].record?.width ?? widgets[i].width) + widgets[i].left)
      bottom = Math.max(bottom, (widgets[i].record?.height ?? widgets[i].height) + widgets[i].top)
    }
  }
  group.width = right - left
  group.height = bottom - top
  group.left = left
  group.top = top
}

export function updateHoverUuid(uuid: string) {
  widgetState.dHoverUuid = uuid
}

export function setDropOver(uuid: string) {
  widgetState.dDropOverUuid = uuid
}

export function setdActiveElement(data: TdWidgetData) {
  widgetState.dActiveElement = data
}
