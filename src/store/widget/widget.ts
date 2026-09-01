import { customAlphabet } from 'nanoid/non-secure'
import { canvasState, widgetState } from '../state'
import { setDPage } from '../canvas'
import { setLayoutsChange } from '../force'
import type { TdLayout, TdWidgetData } from '../types'
import { updateGroupSize } from './move'
import { selectWidget } from './select'

const nanoid = customAlphabet('1234567890abcdef', 12)

type TUpdateWidgetKey = keyof TdWidgetData

export type TUpdateWidgetPayload = {
  uuid: string
  key: TUpdateWidgetKey
  value: number | string | boolean | Record<string, any> | null
}

export function getWidgets() {
  !widgetState.dLayouts[canvasState.dCurrentPage] && (canvasState.dCurrentPage = canvasState.dCurrentPage - 1)
  return widgetState.dLayouts[canvasState.dCurrentPage].layers
}

export function updateWidgetData({ uuid, key, value }: TUpdateWidgetPayload) {
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  // Clearing an optional setting should leave no trace in the saved design,
  // rather than an empty object every later reader has to allow for.
  if (widget && value === null) {
    delete widget[key]
    return
  }
  if (widget && widget[key] !== value) {
    switch (key) {
      case 'left':
      case 'top':
        if (widget.isContainer) {
          let dLeft = widget.left - Number(value)
          let dTop = widget.top - Number(value)
          if (key === 'left') {
            dTop = 0
          }
          if (key === 'top') {
            dLeft = 0
          }
          const len = widgetState.dWidgets.length
          for (let i = 0; i < len; ++i) {
            const child = widgetState.dWidgets[i]
            if (child.parent === widget.uuid) {
              child.left -= dLeft
              child.top -= dTop
            }
          }
        }
        break
    }
    widget[key] = value
  }
}

/**
 * Names a layer. Blank means unnamed, which shows the element's own text or the
 * kind of thing it is instead, so clearing a name hands the label back to the
 * artwork.
 */
export function renameWidget(uuid: string, label: string) {
  const name = label.trim()
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (!widget || (widget.label || '') === name) return
  updateWidgetData({ uuid, key: 'label', value: name || null })
}

export type TUpdateWidgetMultiplePayload = {
  uuid: string
  data: {
    key: TUpdateWidgetKey
    value: number
  }[]
}

export function updateWidgetMultiple({ uuid, data }: TUpdateWidgetMultiplePayload) {
  for (const item of data) {
    const { key, value } = item
    const widget = widgetState.dWidgets.find((w) => w.uuid === uuid)
    if (widget && widget[key] !== value) {
      switch (key) {
        case 'left':
        case 'top':
          if (widget.isContainer) {
            let dLeft = widget.left - value
            let dTop = widget.top - value
            if (key === 'left') {
              dTop = 0
            }
            if (key === 'top') {
              dLeft = 0
            }
            const len = widgetState.dWidgets.length
            for (let i = 0; i < len; ++i) {
              const child = widgetState.dWidgets[i]
              if (child.parent === widget.uuid) {
                child.left -= dLeft
                child.top -= dTop
              }
            }
          }
          break
      }
      widget[key] = value
    }
  }
}

export function addWidget(setting: TdWidgetData) {
  setting.uuid = nanoid()
  widgetState.dWidgets.push(setting)
  const len = widgetState.dWidgets.length
  selectWidget({ uuid: widgetState.dWidgets[len - 1].uuid })
}

export function deleteWidget() {
  const widgets = widgetState.dWidgets
  const selectWidgets = widgetState.dSelectWidgets
  const activeElement = widgetState.dActiveElement
  if (!activeElement) return

  let count = 0
  if (selectWidgets.length !== 0) {
    for (let i = 0; i < selectWidgets.length; ++i) {
      const uuid = selectWidgets[i].uuid
      const index = widgets.findIndex((item) => item.uuid === uuid)
      widgets.splice(index, 1)
    }
    widgetState.dSelectWidgets = []
    selectWidget({ uuid: '-1' })
  } else {
    if (activeElement.type === 'page') {
      return
    }

    const uuid = activeElement.uuid
    const index = widgets.findIndex((item) => item.uuid === uuid)

    widgets.splice(index, 1)

    if (activeElement.isContainer) {
      for (let i = widgets.length - 1; i >= 0; --i) {
        if (widgets[i].parent === uuid) {
          widgets.splice(i, 1)
        }
      }
    } else if (activeElement.parent !== '-1') {
      for (let i = widgets.length - 1; i >= 0; --i) {
        if (widgets[i].parent === activeElement.parent) {
          count++
          if (count > 1) {
            break
          }
        }
      }
      if (count <= 1) {
        const parentIndex = widgets.findIndex((item) => item.uuid === activeElement.parent)
        widgets.splice(parentIndex, 1)
        if (count === 1) {
          const widget = widgets.find((item) => item.parent === activeElement.parent)
          widget && (widget.parent = '-1')
        }
        count = 0
      }
    }
  }

  if (count === 0) {
    widgetState.dActiveElement = canvasState.dPage
  } else {
    const tmp = widgets.find((item) => item.uuid === activeElement.parent)
    tmp && (widgetState.dActiveElement = tmp)
  }

  if (widgetState.dActiveElement && widgetState.dActiveElement.uuid !== '-1') {
    updateGroupSize(widgetState.dActiveElement.uuid)
  }
}

export type TsetWidgetStyleData = {
  uuid: string
  key: keyof TdWidgetData
  value: any
}

export function setWidgetStyle({ uuid, key, value }: TsetWidgetStyleData) {
  const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
  if (!widget) return
  widget[key] = value
}

export function setDWidgets(e: TdWidgetData[]) {
  widgetState.dWidgets = e
  updateDWidgets()
}

export function setDLayouts(data: TdLayout[]) {
  widgetState.dLayouts = data
  widgetState.dWidgets = getWidgets()
  setLayoutsChange()
  setDPage(data[canvasState.dCurrentPage].global)
  setTimeout(() => {
    widgetState.dActiveElement = canvasState.dPage
  }, 150)
}

export function updateDWidgets() {
  const { dCurrentPage } = canvasState
  widgetState.dLayouts[dCurrentPage].layers = widgetState.dWidgets
  widgetState.dWidgets = getWidgets()
}

let lastLocks: boolean[] | null = null
export function lockWidgets() {
  if (lastLocks && lastLocks.length > 0) {
    for (let i = 0; i < lastLocks.length; i++) {
      widgetState.dWidgets[i].lock = lastLocks[i]
    }
    lastLocks = []
  } else {
    lastLocks = []
    for (const widget of widgetState.dWidgets) {
      lastLocks.push(widget?.lock || false)
    }
    widgetState.dWidgets.forEach((widget) => {
      widget.lock = true
    })
  }
}
