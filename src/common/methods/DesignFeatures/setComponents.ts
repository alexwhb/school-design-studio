/*
 * @Author: ShawnPhang
 * @Date: 2022-02-22 15:06:14
 * @LastEditors: ShawnPhang <https://m.palxp.cn>, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-02 11:50:00
 */
import { canvasState } from '@/store/state'
import type { TdWidgetData } from '@/store/types'
// import store from '@/store'

export default async function setCompData(item: TdWidgetData[] | string) {
  const group: TdWidgetData[] = typeof item === 'string' ? JSON.parse(item) : JSON.parse(JSON.stringify(item))
  let parent: Partial<TdWidgetData> = {}
  Array.isArray(group) &&
    group.forEach((element) => {
      element.type === 'w-group' && (parent = element)
    })
  const { width: screenWidth, height: screenHeight } = canvasState.dPage
  const { width: imgWidth = 0, height: imgHeight = 0 } = parent
  let ratio = 1
  if (imgWidth > screenWidth || imgHeight > screenHeight) {
    ratio = Math.min(screenWidth / imgWidth, screenHeight / imgHeight)
  }
  if (ratio < 1) {
    ratio *= canvasState.dZoom / 100
    group.forEach((element) => {
      element.fontSize && (element.fontSize *= ratio)
      element.width *= ratio
      element.height *= ratio
      element.left *= ratio
      element.top *= ratio
    })
  }
  return group
}
