/*
 * @Author: ShawnPhang
 * @Date: 2021-07-17 11:20:22
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-01 20:55:51
 */

import type { ComponentType, CSSProperties } from 'react'
import { BrandIcon, GraphicsIcon, PhotosIcon, TemplatesIcon, TextIcon } from '@/components/ui/icons'

export type TWidgetClassifyData = {
  name: string
  /** A glyph from the icon font, or '' when `Icon` draws the tab instead. */
  icon: string
  /** An SVG icon, for a tab the icon font has no glyph for. */
  Icon?: ComponentType<{ className?: string }>
  show: boolean
  component: string
  style?: CSSProperties
}

export default [
  {
    name: 'Templates',
    icon: '',
    Icon: TemplatesIcon,
    show: false,
    component: 'temp-list-wrap',
  },
  {
    name: 'Graphics',
    icon: '',
    Icon: GraphicsIcon,
    show: false,
    component: 'graph-list-wrap',
  },
  {
    name: 'Text',
    icon: '',
    Icon: TextIcon,
    show: false,
    component: 'text-list-wrap',
  },
  {
    name: 'Photos',
    icon: '',
    Icon: PhotosIcon,
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
    name: 'Brand',
    icon: '',
    Icon: BrandIcon,
    show: false,
    component: 'brand-wrap',
  },
] as TWidgetClassifyData[]
