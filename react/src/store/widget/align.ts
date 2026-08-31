import { canvasState, widgetState } from '../state'
import type { TdWidgetData } from '../types'

type TAlign = 'left' | 'ch' | 'right' | 'top' | 'cv' | 'bottom'

export type TUpdateAlignData = {
  align: TAlign
  uuid: string
  group?: TdWidgetData
}

export function updateAlign({ align, uuid, group }: TUpdateAlignData) {
  const widgets = widgetState.dWidgets
  const target = uuid ? widgets.find((item) => item.uuid === uuid) : widgetState.dActiveElement
  let parent: any = group || canvasState.dPage

  if (!target) return

  if (target.parent !== '-1') {
    const tmp = widgets.find((item) => item.uuid === target.parent)
    tmp && (parent = tmp)
  }

  let left = target.left
  let top = target.top
  let pw = parent.record?.width || parent.width
  let ph = parent.record?.height || parent.height

  if (parent.uuid === '-1') {
    pw = parent.width
    ph = parent.height
  }

  const targetW = target.width
  const targetH = target.height
  switch (align) {
    case 'left':
      left = parent.left
      break
    case 'ch':
      left = parent.left + pw / 2 - targetW / 2
      break
    case 'right':
      left = parent.left + pw - targetW
      break
    case 'top':
      top = parent.top
      break
    case 'cv':
      top = parent.top + ph / 2 - targetH / 2
      break
    case 'bottom':
      top = parent.top + ph - targetH
      break
  }

  if (target.left !== left || target.top !== top) {
    if (target.isContainer) {
      const dLeft = target.left - left
      const dTop = target.top - top
      const len = widgets.length
      for (let i = 0; i < len; ++i) {
        const widget = widgets[i]
        if (widget.parent === target.uuid) {
          widget.left -= dLeft
          widget.top -= dTop
        }
      }
    }
    target.left = left
    target.top = top
  }
}
