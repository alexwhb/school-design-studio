/*
 * @Author: ShawnPhang
 * @Date: 2023-09-14 11:33:44
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-19 03:07:18
 */
import diff from 'microdiff'
import { produce, applyPatches, enablePatches, type Patch } from 'immer'
enablePatches()
const ops: any = {
  CHANGE: 'replace',
  CREATE: 'add',
  REMOVE: 'remove',
}

/**
 * The step from one state of the design to another, as a pair of immer patch
 * lists: the first takes `before` to `after`, the second takes it back.
 *
 * Both arguments are plain JSON, and `before` is used up — it is the draft the
 * forward patches are recorded against.
 */
export default function diffLayouts(before: unknown, after: unknown): { patches: Patch[]; inversePatches: Patch[] } {
  const diffData: any = diff(before as any, after as any)
  let result: { patches: Patch[]; inversePatches: Patch[] } = { patches: [], inversePatches: [] }
  produce(
    before,
    (draft) => {
      for (const d of diffData) {
        d.op = ops[d.type]
      }
      applyPatches(draft as any, diffData)
    },
    (patches, inversePatches) => {
      result = { patches, inversePatches }
    },
  )
  return result
}
