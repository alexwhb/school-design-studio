/*
 * @Author: ShawnPhang
 * @Date: 2021-08-23 17:25:35
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-10-09 10:42:54
 */
export const getImage = (imgItem: string | File): Promise<HTMLImageElement> => {
  const img = new Image()

  const url = window.URL || window.webkitURL
  img.src = typeof imgItem === 'string' ? imgItem : url.createObjectURL(imgItem)

  return new Promise((resolve) => {
    if (img.complete) {
      resolve(img)
    } else {
      img.onload = function () {
        resolve(img)
      }
    }
  })
}
