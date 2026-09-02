import { customAlphabet } from 'nanoid/non-secure'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { updateDWidgets } from './widget'

const nanoid = customAlphabet('1234567890abcdef', 12)

/** Template authors often wrote ordinary percent signs, not URI escapes. */
function decodeText(text: string) {
  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

export function setTemplate(allWidgets: TdWidgetData[]) {
  allWidgets.forEach((item) => {
    Number(item.uuid) < 0 && (item.uuid = nanoid())
    item.text && (item.text = decodeText(item.text))
    widgetState.dWidgets.push(item)
  })
  updateDWidgets()
}
