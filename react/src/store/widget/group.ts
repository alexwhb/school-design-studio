import { customAlphabet } from 'nanoid/non-secure'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'

const nanoid = customAlphabet('1234567890abcdef', 12)

export function addGroup(group: TdWidgetData[]) {
  let parent: TdWidgetData | null = null
  group.forEach((item) => {
    item.uuid = nanoid()
    item.type === 'w-group' && (parent = item)
  })
  group.forEach((item) => {
    !item.isContainer && parent && (item.parent = (parent as TdWidgetData).uuid)
    item.text && (item.text = decodeURIComponent(item.text))
    widgetState.dWidgets.push(item)
  })
  const len = widgetState.dWidgets.length
  widgetState.dActiveElement = widgetState.dWidgets[len - 1]
}
