/*
 * @Author: ShawnPhang
 * @Date: 2023-09-14 11:33:44
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-19 03:07:18
 */
import diff from 'microdiff'
import { produce, applyPatches, enablePatches } from 'immer'
enablePatches()
const ops: any = {
  CHANGE: 'replace',
  CREATE: 'add',
  REMOVE: 'remove',
}
let cloneData = ''

export default class {
  private notifi: any
  constructor() {}
  /**
   * onmessage
   */
  public onmessage(cb: any) {
    this.notifi = cb
  }
  public postMessage(e: any) {
    if (!e) return
    if (e.op === 'done') {
      if (!cloneData) return
      let fork = JSON.parse(cloneData)
      let curArray = JSON.parse(e.data)
      let diffData: any = diff(fork, curArray)
      fork = produce(
        fork,
        (draft) => {
          for (const d of diffData) {
            d.op = ops[d.type]
          }
          draft = applyPatches(draft, diffData)
        },
        (patches, inversePatches) => {
          this.notifi({ patches, inversePatches })
        },
      )
      cloneData = ''
    } else cloneData = e.data
  }
}
