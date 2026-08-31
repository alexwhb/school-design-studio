/*
 * @Author: ShawnPhang
 * @Date: 2021-07-17 11:20:22
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-01 20:55:51
 */

import { StyleValue } from "vue"

export type TWidgetClassifyData = {
  name: string
  icon: string
  show: boolean
  component: string
  style?: StyleValue
}

export default [
  {
    name: 'Templates',
    icon: 'icon-moban',
    show: false,
    component: 'temp-list-wrap',
  },
  {
    name: 'Elements',
    icon: 'icon-sucai',
    show: false,
    component: 'graph-list-wrap',
  },
  {
    name: 'Text',
    icon: 'icon-wenzi',
    show: false,
    style: { fontWeight: 600 },
    component: 'text-list-wrap',
  },
  {
    name: 'Photos',
    icon: 'icon-gallery',
    show: false,
    component: 'photo-list-wrap',
  },
  // {
  //   name: 'Background',
  //   icon: 'icon-beijing',
  //   show: false,
  //   component: 'bg-img-list-wrap',
  // },
  {
    name: 'Tools',
    icon: 'icon-zujian01',
    show: false,
    component: 'tools-list-wrap',
  },
  {
    name: 'Uploads',
    icon: 'icon-shangchuan',
    show: false,
    component: 'user-wrap',
  },
] as TWidgetClassifyData[]
