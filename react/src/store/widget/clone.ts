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
