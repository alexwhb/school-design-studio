/*
 * @Author: ShawnPhang
 * @Date: 2021-08-10 15:42:12
 * @LastEditors: ShawnPhang
 * @LastEditTime: 2022-03-13 16:17:54
 */
const arr = ['w-text', 'w-image', 'w-svg', 'w-rect', 'w-ellipse', 'w-polygon', 'w-path', 'w-group', 'w-qrcode', 'w-table']

export function getTarget(currentTarget: HTMLElement): Promise<HTMLElement | null> {
  let collector: string[] = []
  let groupTarger: HTMLElement | null = null
  let saveTarger: HTMLElement | null = null
  return new Promise((resolve) => {
    function findTarget(target: HTMLElement | null) {
      if (!target || target.id === 'page-design') {
        if (collector.length > 1) {
          resolve(groupTarger)
        } else {
          resolve(saveTarger ?? currentTarget)
        }
        return
      }
      const t = Array.from(target.classList)

      collector = collector.concat(
        t.filter((x) => {
          arr.includes(x) && (saveTarger = target)
          x === 'w-group' && (groupTarger = target)
          return arr.includes(x)
        }),
      )
      findTarget(target.parentElement)
    }
    findTarget(currentTarget)
  })
}

export function getFinalTarget(currentTarget: HTMLElement) {
  let collector: string[] = []
  // let groupTarger: HTMLElement | null = null
  // let saveTarger: HTMLElement | null = null
  return new Promise((resolve) => {
    function findTarget(target: HTMLElement | null) {
      if (!target || target.id === 'page-design') {
        resolve(target)
        return
      }
      const t = Array.from(target.classList)

      collector = collector.concat(
        t.filter((x) => {
          // arr.includes(x) && (saveTarger = target)
          // x === 'w-group' && (groupTarger = target)
          return arr.includes(x)
        }),
      )

      findTarget(target.parentElement)
    }
    findTarget(currentTarget)
  })
}
