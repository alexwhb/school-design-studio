/*
 * @Author: ShawnPhang
 * @Date: 2021-08-02 18:27:27
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-11-14 16:41:19
 */

import type { ComponentType } from 'react'
import { BulletListIcon, NumberListIcon } from '@/components/ui/icons'
import { AlignListData } from './AlignListData'

export type TStyleIconData = {
  key: string
  icon: string
  tip: string
  value: string[]
  select: boolean
  extraIcon?: boolean
}

export const styleIconList1 = [
  {
    key: 'fontWeight',
    icon: 'icon-bold',
    tip: 'Bold',
    value: ['normal', 'bold'],
    select: false,
  },
  {
    key: 'fontStyle',
    icon: 'icon-italic',
    tip: 'Italic',
    value: ['normal', 'italic'],
    select: false,
  },
  {
    key: 'textDecoration',
    icon: 'icon-underline',
    tip: 'Underline',
    value: ['none', 'underline'],
    select: false,
  },
  {
    key: 'textDecoration',
    icon: 'icon-strikethrough',
    tip: 'Strikethrough',
    value: ['none', 'line-through'],
    select: false,
  },
  {
    key: 'writingMode',
    icon: 'icon-textorientation',
    tip: 'Vertical text',
    value: ['horizontal-tb', 'vertical-rl'], // tb-rl
    select: false,
  },
] as TStyleIconData[]

export type TStyleIconData2 = {
  key: string
  /** A glyph from the icon font, or `Icon` when the font has none. */
  icon?: string
  Icon?: ComponentType<{ className?: string }>
  tip: string
  value: string
  select: boolean
}

export const styleIconList2 = [
  {
    key: 'textAlign',
    icon: 'icon-align-left-text',
    tip: 'Align left',
    value: 'left',
    select: false,
  },
  {
    key: 'textAlign',
    icon: 'icon-align-center-text',
    tip: 'Align centre',
    value: 'center',
    select: false,
  },
  {
    key: 'textAlign',
    icon: 'icon-align-right-text',
    tip: 'Align right',
    value: 'right',
    select: false,
  },
  {
    key: 'textAlign',
    icon: 'icon-align-justify-text',
    tip: 'Justify',
    value: 'justify',
    select: false,
  },
  {
    key: 'textAlignLast',
    icon: 'icon-align-justify-text',
    tip: 'Justify all',
    value: 'justify',
    select: false,
  },
  {
    key: 'listStyle',
    Icon: BulletListIcon,
    tip: 'Bulleted list',
    value: 'bullet',
    select: false,
  },
  {
    key: 'listStyle',
    Icon: NumberListIcon,
    tip: 'Numbered list',
    value: 'number',
    select: false,
  },
] as TStyleIconData2[]

export const alignIconList = [
  {
    key: 'align',
    icon: 'icon-align-left',
    tip: 'Align left',
    value: 'left',
  },
  {
    key: 'align',
    icon: 'icon-align-center-horiz',
    tip: 'Align centre',
    value: 'ch',
  },
  {
    key: 'align',
    icon: 'icon-align-right',
    tip: 'Align right',
    value: 'right',
  },
  {
    key: 'align',
    icon: 'icon-align-top',
    tip: 'Align top',
    value: 'top',
  },
  {
    key: 'align',
    icon: 'icon-align-center-verti',
    tip: 'Align middle',
    value: 'cv',
  },
  {
    key: 'align',
    icon: 'icon-align-bottom',
    tip: 'Align bottom',
    value: 'bottom',
  },
] as AlignListData[]
