import { customAlphabet } from 'nanoid/non-secure'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { addWidget } from './widget'

const nanoid = customAlphabet('1234567890abcdef', 12)

export function copyWidget() {
  const activeElement = JSON.parse(JSON.stringify(widgetState.dActiveElement))
  if (!activeElement || activeElement.type === 'page') {
    return
  }
  navigator.clipboard.writeText('')
  const container: TdWidgetData[] = []
  const selectWidgets = widgetState.dSelectWidgets
  if (selectWidgets.length === 0) {
    const uuid = activeElement.uuid
    container.push(activeElement)
    if (activeElement.isContainer) {
      const widgets = widgetState.dWidgets
      for (let i = 0; i < widgets.length; ++i) {
        if (widgets[i].parent === uuid) {
          container.push(widgets[i])
        }
      }
    }
  } else {
    for (let i = 0; i < selectWidgets.length; ++i) {
      const uuid = selectWidgets[i].uuid
      container.push(selectWidgets[i])
      if (selectWidgets[i].isContainer) {
        const widgets = widgetState.dWidgets
        for (let j = 0; j < widgets.length; ++j) {
          if (widgets[j].parent === uuid) {
            container.push(widgets[j])
          }
        }
      }
    }
  }
  widgetState.dCopyElement = JSON.parse(JSON.stringify(container))
}

export function pasteWidget() {
  const copyElement: TdWidgetData[] = JSON.parse(JSON.stringify(widgetState.dCopyElement))
  const container = copyElement.find((item) => item.isContainer)
  for (let i = 0; i < copyElement.length; ++i) {
    copyElement[i].uuid = nanoid()
    if (container && copyElement[i].uuid !== container.uuid) {
      copyElement[i].parent = container.uuid
    } else {
      copyElement[i].parent = '-1'
    }
    copyElement[i].top += 30
    copyElement[i].left += 30
    addWidget(copyElement[i])
  }
  widgetState.dActiveElement = copyElement[0]
  widgetState.dSelectWidgets = copyElement
  if (container) {
    widgetState.dActiveElement = container
    widgetState.dSelectWidgets = []
  }
  copyWidget()
}

/**
 * Puts a copy of the selection on the canvas straight away, without going
 * through the copy buffer — a duplicate should not cost you whatever you had
 * copied earlier.
 *
 * Grouped elements point at their container by id, so a group and its children
 * are renumbered together and the child links rewritten to match, the same rule
 * `duplicatePage` follows. Children keep page-absolute coordinates, so every
 * copy is offset by the same 30px and the group arrives intact.
 */
export function duplicateOne() {
  const activeElement = widgetState.dActiveElement
  if (!activeElement || activeElement.uuid === '-1' || activeElement.type === 'page') {
    return
  }

  const selected = widgetState.dSelectWidgets.length > 0 ? widgetState.dSelectWidgets : [activeElement]
  const sources: TdWidgetData[] = []
  for (const widget of selected) {
    sources.push(widget)
    if (widget.isContainer) {
      sources.push(...widgetState.dWidgets.filter((item) => item.parent === widget.uuid))
    }
  }

  const copies: TdWidgetData[] = JSON.parse(JSON.stringify(sources))
  const renamed = new Map<string, string>()
  const topLevel = new Set<string>()
  const selectedIds = new Set(selected.map((widget) => widget.uuid))
  for (const copy of copies) {
    const fresh = nanoid()
    renamed.set(copy.uuid, fresh)
    selectedIds.has(copy.uuid) && topLevel.add(fresh)
    copy.uuid = fresh
  }
  for (const copy of copies) {
    // '-1' is the page, which no copy is ever renamed to.
    if (copy.parent && renamed.has(copy.parent)) {
      copy.parent = renamed.get(copy.parent) as string
    }
    copy.top += 30
    copy.left += 30
    widgetState.dWidgets.push(copy)
  }

  // Select the copies as they now live in the store, not the plain objects that
  // were pushed: editing the selection has to reach the widget on the canvas.
  const added = copies
    .filter((copy) => topLevel.has(copy.uuid))
    .map((copy) => widgetState.dWidgets.find((item) => item.uuid === copy.uuid) as TdWidgetData)
  widgetState.dActiveElement = added[0]
  // A group is one thing on the canvas, so it is the active element on its own
  // rather than a multiple selection of itself and its children.
  widgetState.dSelectWidgets = added.length > 1 ? added : []
}
