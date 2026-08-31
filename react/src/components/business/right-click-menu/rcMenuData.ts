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
  type: 'copy' | 'paste' | 'index-up' | 'index-down' | 'del' | 'ungroup'
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
    type: 'index-up',
    text: 'Bring forward',
  },
  {
    type: 'index-down',
    text: 'Send backward',
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
