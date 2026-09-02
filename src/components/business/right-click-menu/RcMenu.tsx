import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { getTarget } from '@/common/methods/target'
import { controlState, widgetState } from '@/store/state'
import { copyWidget, deleteWidget, pasteWidget, selectWidget, ungroup } from '@/store/widget'
import { arrangeLayer } from '@/components/modules/settings/ArrangeRow'
import { menuList as menu, pageMenu, widgetMenu, type TMenuItemData, type TWidgetItemData } from './rcMenuData'
import { cx } from '@/utils/dom'
import './rcMenu.less'

export default function RcMenu() {
  const [menuListData, setMenuListData] = useState<TMenuItemData>({ ...menu })
  const [showMenuBg, setShowMenuBg] = useState(false)
  const { dCopyElement } = useSnapshot(widgetState)

  useEffect(() => {
    document.oncontextmenu = mouseRightClick
    return () => {
      document.oncontextmenu = null
    }
  })

  async function mouseRightClick(e: MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    if (showMenuBg) {
      setShowMenuBg(false)
      return
    }
    if (!e.target) return
    const target = await getTarget(e.target as HTMLElement)
    if (!target) return
    const type = target.getAttribute('data-type')
    if (type) {
      let uuid = target.getAttribute('data-uuid')

      if (uuid !== '-1' && !controlState.dAltDown) {
        const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
        const active = widgetState.dActiveElement
        if (widget?.parent !== '-1' && widget?.parent !== active?.uuid && widget?.parent !== active?.parent) {
          uuid = widget?.parent || ''
        }
      }
      selectWidget({ uuid: uuid ?? '-1' })
      showMenu(e)
    }
    return false
  }

  function showMenu(e: MouseEvent) {
    const active = widgetState.dActiveElement
    const isPage = active?.uuid === '-1'
    let list: TWidgetItemData[] = isPage ? pageMenu : widgetMenu
    if (active?.isContainer) {
      list = ([{ type: 'ungroup', text: 'Ungroup' }] as TWidgetItemData[]).concat(list)
    }
    let mx = e.pageX
    let my = e.pageY
    const listWidth = 160
    if (mx + listWidth > window.innerWidth) {
      mx -= listWidth
    }
    const listHeight = (14 + 10) * list.length + 10
    if (my + listHeight > window.innerHeight) {
      my -= listHeight
    }
    setMenuListData({ list, left: mx, top: my })
    setShowMenuBg(true)
  }

  function closeMenu() {
    setShowMenuBg(false)
  }

  function selectMenu(type: TWidgetItemData['type']) {
    const active = widgetState.dActiveElement
    switch (type) {
      case 'copy':
        copyWidget()
        break
      case 'paste':
        if (widgetState.dCopyElement.length === 0) {
          return
        }
        pasteWidget()
        break
      case 'index-up':
        arrangeLayer(active?.uuid || '', { key: 'zIndex', value: 1 })
        break
      case 'index-down':
        arrangeLayer(active?.uuid || '', { key: 'zIndex', value: -1 })
        break
      case 'index-front':
        arrangeLayer(active?.uuid || '', { key: 'zOrder', value: 'front' })
        break
      case 'index-back':
        arrangeLayer(active?.uuid || '', { key: 'zOrder', value: 'back' })
        break
      case 'del':
        deleteWidget()
        break
      case 'ungroup':
        ungroup(active?.uuid || '')
        break
    }
    closeMenu()
  }

  return (
    <div id="menu-bg" className="menu-bg" style={{ display: showMenuBg ? undefined : 'none' }} onClick={closeMenu}>
      <ul className="menu-list" style={{ left: menuListData.left + 'px', top: menuListData.top + 'px' }}>
        {menuListData.list.map((item, index) => (
          <li
            key={index}
            className={cx('menu-item', { 'disable-menu': dCopyElement.length === 0 && item.type === 'paste' })}
            onClick={(e) => {
              e.stopPropagation()
              selectMenu(item.type)
            }}
          >
            {item.text}
          </li>
        ))}
      </ul>
    </div>
  )
}
