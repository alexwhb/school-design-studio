/*
 * @Author: Jeremy Yu
 * @Date: 2024-03-28 14:00:00
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 09:29:27
 */

import { useCanvasStore, useHistoryStore } from "@/store"
import { TWidgetStore, TdWidgetData } from ".."

type TAlign = 'left' | 'ch' | 'right' | 'top' | 'cv' | 'bottom'

export type TUpdateAlignData = {
  align: TAlign
  uuid: string
  group?: TdWidgetData
}

export function updateAlign(store: TWidgetStore, { align, uuid, group }: TUpdateAlignData) {
  const pageStore = useCanvasStore()
  const historyStore = useHistoryStore()
  const canvasStore = useCanvasStore()

  const widgets = store.dWidgets
  const target = uuid ? widgets.find((item: any) => item.uuid === uuid) : store.dActiveElement
  // The page stands in as the parent when an element is aligned against the
  // page itself. A page has no record, hence the optional reads below.
  let parent: TdWidgetData = group || pageStore.dPage

  if (!target) return

  if (target.parent !== '-1') {
    const tmp = widgets.find((item: any) => item.uuid === target.parent)
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
    case 'ch': // Centre horizontally
      left = parent.left + pw / 2 - targetW / 2
      break
    case 'right':
      left = parent.left + pw - targetW
      break
    case 'top':
      top = parent.top
      break
    case 'cv': // Centre vertically
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

    canvasStore.reChangeCanvas()
    // store.dispatch('reChangeCanvas')
  }
}
