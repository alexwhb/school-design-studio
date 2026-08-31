/*
 * @Author: ShawnPhang
 * @Date: 2022-04-15 10:51:50
 * @Description:
 * @LastEditors: ShawnPhang, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-01 20:55:51
 */

import { TIconItemSelectData } from "@/components/modules/settings/iconItemSelect.vue"

export default [
  {
    key: 'zIndex',
    icon: 'icon-layer-up',
    tip: 'Bring forward',
    value: 1,
  },
  {
    key: 'zIndex',
    icon: 'icon-layer-down',
    tip: 'Send backward',
    value: -1,
  },
] as TIconItemSelectData[]
