import { canvasState, widgetState } from '../state'
import type { TdWidgetData } from '../types'

type TAlign = 'left' | 'ch' | 'right' | 'top' | 'cv' | 'bottom'

type TDistribute = 'horizontal' | 'vertical'

export type TUpdateAlignData = {
  align: TAlign
  uuid: string
  group?: TdWidgetData
}

export type TDistributeGeometryData = {
  distribute: TDistribute
  uuids: string[]
}

/**
 * Puts a widget down at a new place, taking whatever it holds with it: a group
 * that moved on its own would leave its children behind.
 */
function moveWidgetTo(target: TdWidgetData, left: number, top: number) {
  if (target.left === left && target.top === top) return
  const widgets = widgetState.dWidgets
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

  moveWidgetTo(target, left, top)
}

/**
 * Spaces the given widgets evenly along one axis, the way XD and Figma do it:
 * the outermost two stay exactly where they are and everything between them is
 * slid over until every gap is the same. Two widgets are already evenly spaced
 * by definition, so there is nothing to even out below three.
 *
 * Sizes come from the rendered box where there is one — a text box is as wide
 * as the browser drew it, not as wide as the store asked for, and spacing the
 * store's numbers would leave visible gaps that disagree.
 */
export function distributeGeometry({ distribute, uuids }: TDistributeGeometryData) {
  const widgets = widgetState.dWidgets
  const targets = uuids.map((uuid) => widgets.find((item) => item.uuid === uuid)).filter((item): item is TdWidgetData => !!item)

  if (targets.length < 3) return

  const horizontal = distribute === 'horizontal'
  const startOf = (widget: TdWidgetData) => (horizontal ? widget.left : widget.top)
  const sizeOf = (widget: TdWidgetData) => (horizontal ? (widget.record?.width ?? widget.width) : (widget.record?.height ?? widget.height))

  const ordered = targets.slice().sort((a, b) => startOf(a) - startOf(b) || sizeOf(a) - sizeOf(b))
  const from = startOf(ordered[0])
  const to = ordered.reduce((edge, widget) => Math.max(edge, startOf(widget) + sizeOf(widget)), -Infinity)
  const occupied = ordered.reduce((total, widget) => total + sizeOf(widget), 0)
  // Negative when the widgets overlap: they then overlap by an even amount,
  // which is still the answer to "space these evenly".
  const gap = (to - from - occupied) / (ordered.length - 1)

  // The cursor keeps the exact position and only the placement is rounded, so
  // the rounding cannot accumulate along the row.
  let cursor = from
  for (const widget of ordered) {
    const placed = Math.round(cursor)
    moveWidgetTo(widget, horizontal ? placed : widget.left, horizontal ? widget.top : placed)
    cursor += sizeOf(widget) + gap
  }
}
