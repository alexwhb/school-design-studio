/*
 * @Author: ShawnPhang
 * @Date: 2022-02-22 15:06:14
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-03-22 16:00:17
 */
// import store from '@/store'
// import { getImage } from '../getImgDetail'
import api from '@/api'
import setImageData, { type TItem2DataParam } from '@/common/methods/DesignFeatures/setImage'
import { resolveStockImage, type StockImage } from '@/common/methods/stockImage'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { wSvgSetting } from '@/components/modules/widgets/wSvg/wSvgSetting'

/**
 * The widget a dropped thing becomes.
 *
 * Returns null when the drop should not happen after all — the host was asked
 * for a copy of a stock photograph and could not take one, and putting the
 * remote address in instead would be putting in the thing it refuses.
 */
export default async function (type: string, item: TCommonItemData, data: Record<string, any>) {
  let setting = data
  if (type === 'text') {
    !item.fontFamily && !item.color ? (setting = JSON.parse(JSON.stringify(wTextSetting))) : (setting = item)
    !setting.text ? (setting.text = 'Double-click to edit') : (setting.text = decodeURIComponent(setting.text)) // item.text
    setting.fontSize = item.fontSize
    setting.width = item.width || item.fontSize * setting.text.length
    setting.fontWeight = item.fontWeight
  }
  if (type === 'image' || type === 'mask') {
    // A picture dropped from the stock library is taken into the host's own
    // store first, when the host asked for that. The copy is made here rather
    // than when the drag started, so a drag that is thought better of costs
    // nothing. A mask is a shape the studio ships, so it comes back unchanged
    // — but it is read from the same answer, so the two cannot disagree about
    // which picture this is. See `stockImage.ts`.
    const picture = await resolveStockImage(item.value as StockImage)
    if (!picture) return null
    if (type === 'image') {
      const used = (item.value as { downloadLocation?: string }).downloadLocation
      if (used) api.material.trackImageUse(used)
    }
    setting = JSON.parse(JSON.stringify(wImageSetting))
    const img = await setImageData(picture as TItem2DataParam)
    setting.width = img.width
    setting.height = img.height // parseInt(100 / item.value.ratio, 10)
    setting.imgUrl = picture.url
    if (type === 'mask') setting.mask = picture.url
  }
  if (type === 'svg') {
    setting = JSON.parse(JSON.stringify(wSvgSetting))
    const img = await setImageData(item.value as TItem2DataParam)
    setting.width = img.width
    setting.height = img.height // parseInt(100 / item.value.ratio, 10)
    setting.svgUrl = item.value.url
    const models = JSON.parse(item.value.model)
    for (const key in models) {
      if (Object.hasOwnProperty.call(models, key)) {
        setting[key] = models[key]
      }
    }
  }
  return setting
}
