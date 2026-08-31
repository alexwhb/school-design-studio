import { canvasState, controlState, widgetState } from '../state'
import { updateGroupSize } from './move'

export type TInitResize = {
  startX: number
  startY: number
  originX: number
  originY: number
  width: number
  height: number
}

export type TSize = {
  width: number
  height: number
}

export type TdResizePayload = {
  x: number
  y: number
  dirs: 'top' | 'left' | 'bottom' | 'right'
}

export function initDResize(payload: TInitResize) {
  const mouseXY = widgetState.dMouseXY
  const widgetXY = widgetState.dActiveWidgetXY
  const resizeWH = widgetState.dResizeWH
  mouseXY.x = payload.startX
  mouseXY.y = payload.startY
  widgetXY.x = payload.originX
  widgetXY.y = payload.originY
  resizeWH.width = payload.width
  resizeWH.height = payload.height
}

export function dResize({ x, y, dirs }: TdResizePayload) {
  controlState.dResizeing = true

  const page = canvasState.dPage
  const target = widgetState.dActiveElement
  const mouseXY = widgetState.dMouseXY
  const widgetXY = widgetState.dActiveWidgetXY
  const resizeWH = widgetState.dResizeWH
  let parent: any = page
  if (!target) return
  if (target.parent !== '-1') {
    const tmp = widgetState.dWidgets.find((item) => item.uuid === target.parent)
    if (tmp) {
      parent = tmp
    }
  }

  const dx = x - mouseXY.x
  const dy = y - mouseXY.y

  let left = 0
  let top = 0

  for (let i = 0; i < dirs.length; ++i) {
    const dir = dirs[i]

    switch (dir) {
      case 'top': {
        const t = widgetXY.y + Math.floor((dy * 100) / canvasState.dZoom)
        top = Math.max(t, 0)
        top = Math.min(widgetXY.y + resizeWH.height - target.record.minHeight, top)
        target.height += target.top - top
        target.height = Math.max(target.height, target.record.minHeight)
        target.top = top
        break
      }
      case 'bottom':
        top = Math.floor((dy * 100) / canvasState.dZoom)
        target.height = resizeWH.height + top
        target.height = Math.max(target.height, target.record.minHeight)
        target.height = Math.min(target.height, page.height - target.top)
        break
      case 'left': {
        const tLeft = widgetXY.x + Math.floor((dx * 100) / canvasState.dZoom)
        left = Math.max(tLeft, 0)
        target.width += target.left - left
        target.width = Math.max(target.width, target.record.minWidth)
        left = Math.min(widgetXY.x + resizeWH.width - target.record.minWidth, left)
        target.left = left
        break
      }
      case 'right':
        left = Math.floor((dx * 100) / canvasState.dZoom)
        target.width = resizeWH.width + left
        target.width = Math.max(target.width, target.record.minWidth)
        target.width = Math.min(target.width, page.width - target.left)
        break
    }
  }
  if (parent.uuid !== '-1') {
    updateGroupSize(parent.uuid)
  }
}

export function resize(size: TSize) {
  const { width, height } = size
  const target = widgetState.dActiveElement
  if (!target) return target
  target.width = width
  target.height = height
}

export function autoResizeAll(lastPageSize: TSize) {
  if (!lastPageSize) return
  const { width: lastWidth, height: lastHeight } = lastPageSize
  const { width: pageWidth, height: pageHeight } = canvasState.dPage
  const originWHRatio = lastWidth / lastHeight
  const WHRatio = pageWidth / pageHeight
  const changeFn = originWHRatio > WHRatio ? 'max' : 'min'
  const degree = [pageWidth / lastWidth, pageHeight / lastHeight]
  const ratio = Math[changeFn](...degree)
  const pageDiff = (pageWidth - lastWidth) / 2
  for (const widget of widgetState.dWidgets) {
    const originWidth = widget.width
    let diff = 0
    if (widget.type === 'w-text') {
      widget.fontSize && (widget.fontSize *= ratio)
    } else if (widget.type !== 'w-group') {
      widget.width *= ratio
      widget.height *= ratio
    } else widget.height *= ratio
    diff = (originWidth - widget.width) / 2
    widget.left = widget.left + diff + pageDiff
    widget.top *= degree[1]
  }
}
