import { customAlphabet } from 'nanoid/non-secure'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { updateDWidgets } from './widget'

const nanoid = customAlphabet('1234567890abcdef', 12)

export function setTemplate(allWidgets: TdWidgetData[]) {
  allWidgets.forEach((item) => {
    Number(item.uuid) < 0 && (item.uuid = nanoid())
    item.text && (item.text = decodeURIComponent(item.text))
    widgetState.dWidgets.push(item)
  })
  updateDWidgets()
}
