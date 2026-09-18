/*
 * @Author: ShawnPhang
 * @Date: 2021-07-17 11:20:22
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-03-01 20:55:51
 */

import type { ComponentType, CSSProperties } from 'react'
import { BrandIcon, GraphicsIcon, PhotosIcon, TemplatesIcon, TextIcon } from '@/components/ui/icons'

/**
 * The tab a host's own panel is shown behind. Not in the list below: it only
 * exists when the `assistant` prop does, and WidgetPanel puts it in front.
 */
export const ASSISTANT_PANEL = 'assistant-wrap'

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
    name: 'Brand',
    icon: '',
    Icon: BrandIcon,
    show: false,
    component: 'brand-wrap',
  },
] as TWidgetClassifyData[]
