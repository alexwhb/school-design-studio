/*
 * @Author: ShawnPhang
 * @Date: 2021-07-30 17:38:50
 * @Description:
 * @LastEditors: ShawnPhang, Jeremy Yu <https://github.com/JeremyYu-cn>
 * @Date: 2024-03-04 18:50:00
 */

export type TMenuItemData = {
  left: number
  top: number
  list: TWidgetItemData[]
}

export const menuList: TMenuItemData = {
  left: 0,
  top: 0,
  list: [],
}

export type TWidgetItemData = {
  type: 'copy' | 'paste' | 'duplicate' | 'index-up' | 'index-down' | 'index-front' | 'index-back' | 'lock' | 'hide' | 'del' | 'group' | 'ungroup'
  text: string
}

export const widgetMenu: TWidgetItemData[] = [
  {
    type: 'copy',
    text: 'Copy',
  },
  {
    type: 'paste',
    text: 'Paste',
  },
  {
    type: 'duplicate',
    text: 'Duplicate',
  },
  {
    type: 'index-up',
    text: 'Bring forward',
  },
  {
    type: 'index-down',
    text: 'Send backward',
  },
  {
    type: 'index-front',
    text: 'Bring to front',
  },
  {
    type: 'index-back',
    text: 'Send to back',
  },
  {
    type: 'lock',
    text: 'Lock',
  },
  {
    type: 'hide',
    text: 'Hide',
  },
  {
    type: 'del',
    text: 'Delete',
  },
]

/**
 * More than one thing selected. Everything here works on the whole selection,
 * which is why the stacking moves are not: they take one layer through the
 * order, and "bring these four forward" has no single answer.
 */
export const multiMenu: TWidgetItemData[] = [
  {
    type: 'copy',
    text: 'Copy',
  },
  {
    type: 'paste',
    text: 'Paste',
  },
  {
    type: 'duplicate',
    text: 'Duplicate',
  },
  {
    type: 'group',
    text: 'Group',
  },
  {
    type: 'hide',
    text: 'Hide',
  },
  {
    type: 'del',
    text: 'Delete',
  },
]

export const pageMenu: TWidgetItemData[] = [
  {
    type: 'paste',
    text: 'Paste',
  },
]
