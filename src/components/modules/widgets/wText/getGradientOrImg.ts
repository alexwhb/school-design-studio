/*
 * @Author: ShawnPhang
 * @Date: 2023-11-29 11:00:41
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-11-29 11:01:50
 */
import { toGradientString } from '@/packages/color-picker/utils/gradient'
import patternUri from './patternFill'

export default (effect: any) => {
  let result = ''
  switch (Number(effect.filling.type)) {
    case 2:
      {
        const { angle, stops, type } = effect.filling.gradient
        result = toGradientString(type === 'radial' ? 'radial' : 'linear', angle, stops)
      }
      break
    case 1:
      {
        // A design saved before tiles were kept as markup carries a finished
        // image and no palette; it still paints, it just cannot be recoloured.
        const { pattern, image } = effect.filling.imageContent || {}
        result = `url("${pattern ? patternUri(pattern) : image}")`
      }
      break
    default:
      result = effect.filling.color
      break
  }
  return result
}
