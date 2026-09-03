/*
 * @Author: houchaowei@zhihu.com
 * @Date: 2023-09-01 14:33:23
 * @LastEditors: houchaowei@zhihu.com
 * @LastEditTime: 2023-09-01 14:56:38
 * @FilePath: /poster-design/screenshot/src/utils/uuid.ts
 */

import nodeCrypto from 'crypto'

export default () =>
  // @ts-ignore
  ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c: number) => (c ^ (nodeCrypto.randomBytes(1)[0] & (15 >> (c / 4)))).toString(16))
