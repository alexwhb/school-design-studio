import { customAlphabet } from 'nanoid/non-secure'
import { brandResolver } from '@/common/methods/brandKit'
import { fillLayers } from '@/utils/mergeFields'
import { widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { decodeText } from './template'

const nanoid = customAlphabet('1234567890abcdef', 12)

/**
 * Puts a saved element group on the page. Like setTemplate, this is the one
 * road every group takes — the Text panel, a drop on the board, `?tempid=`
 * with a group type — so the school's fields are filled in here too.
 */
export function addGroup(group: TdWidgetData[]) {
  let parent: TdWidgetData | null = null
  group.forEach((item) => {
    item.uuid = nanoid()
    item.type === 'w-group' && (parent = item)
  })
  group.forEach((item) => {
    !item.isContainer && parent && (item.parent = (parent as TdWidgetData).uuid)
    item.text && (item.text = decodeText(item.text))
  })
  const { layers } = fillLayers(group, brandResolver())
  layers.forEach((item) => {
    widgetState.dWidgets.push(item)
  })
  const len = widgetState.dWidgets.length
  widgetState.dActiveElement = widgetState.dWidgets[len - 1]
}
