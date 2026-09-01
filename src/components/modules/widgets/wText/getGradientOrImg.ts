/*
 * @Author: ShawnPhang
 * @Date: 2023-11-29 11:00:41
 * @Description: 处理字体填充特效
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-11-29 11:01:50
 */
import patternUri from './patternFill'

export default (effect: any) => {
  let result = ''
  switch (Number(effect.filling.type)) {
    case 2:
      {
        const { angle, stops } = effect.filling.gradient
        const gradients = stops.map((x: any) => `${x.color} ${Number(x.offset) * 100}%`)
        result = `linear-gradient(${angle}deg, ${gradients.toString()})`
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
