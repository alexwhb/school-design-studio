import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { getTarget } from '@/common/methods/target'
import { controlState, widgetState } from '@/store/state'
import { copyWidget, deleteWidget, duplicateOne, pasteWidget, selectWidget, setLayerHidden, ungroup } from '@/store/widget'
import { realCombined } from '@/store/group'
import { recordHistory } from '@/common/hooks/history'
import { arrangeLayer } from '@/components/modules/settings/ArrangeRow'
import { menuList as menu, multiMenu, pageMenu, widgetMenu, type TMenuItemData, type TWidgetItemData } from './rcMenuData'
import { cx } from '@/utils/dom'
import './rcMenu.less'

export default function RcMenu() {
  const [menuListData, setMenuListData] = useState<TMenuItemData>({ ...menu })
  const [showMenuBg, setShowMenuBg] = useState(false)
  /**
   * The layer the open menu is about, or '-1' for the page and for a selection
   * of several. Held here rather than read back off dActiveElement, which is
   * only set a tick after the right-click that chose it — long enough that the
   * menu was being built from whatever had been selected before, which is why
   * Ungroup could act on a layer nobody had pointed at.
   */
  const menuUuid = useRef('-1')
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

    // The selection box covers what it is drawn round, and a box round several
    // things covers all of them — so a right-click aimed at the selection lands
    // on Moveable rather than on the page and used to open nothing at all. The
    // menu it wants is the one for what is selected.
    const onSelectionBox = e.target instanceof Element && e.target.closest('.moveable-control-box')
    if (onSelectionBox) {
      const active = widgetState.dActiveElement
      if (widgetState.dSelectWidgets.length > 1) {
        menuUuid.current = '-1'
      } else {
        // The box Moveable parks off-screen when nothing is selected is not a
        // selection, and has no menu.
        if (!active || active.uuid === '-1') return false
        menuUuid.current = active.uuid
      }
      showMenu(e)
      return false
    }

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
      // A right-click inside a selection of several is asking about the lot,
      // not picking one out of it — selecting again would break the selection
      // apart and take Group off the menu it was opened for.
      // '-1' is the page, which every top-level layer is a child of — asking
      // whether it is in the selection would answer yes for all of them.
      const selected = widgetState.dSelectWidgets
      const withinSelection = !!uuid && uuid !== '-1' && selected.length > 1 && selected.some((item) => item.uuid === uuid || item.parent === uuid)
      if (!withinSelection) selectWidget({ uuid: uuid ?? '-1' })
      menuUuid.current = withinSelection ? '-1' : uuid || '-1'
      showMenu(e)
    }
    return false
  }

  function showMenu(e: MouseEvent) {
    const layer = widgetState.dWidgets.find((item) => item.uuid === menuUuid.current)
    const several = widgetState.dSelectWidgets.length > 1
    let list: TWidgetItemData[] = several ? multiMenu : layer ? widgetMenu : pageMenu
    if (!several && layer?.isContainer) {
      list = ([{ type: 'ungroup', text: 'Ungroup' }] as TWidgetItemData[]).concat(list)
    }
    // The item names what it will do, not what the layer is
    list = list.map((item) => (item.type === 'lock' ? { ...item, text: layer?.lock ? 'Unlock' : 'Lock' } : item))
    let mx = e.pageX
    let my = e.pageY
    // Kept in step with .menu-list in rcMenu.less, which is what decides it
    const listWidth = 156
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
    // Whatever was pointed at, which by now is also what is selected — the
    // moves that name one layer say which one rather than asking again.
    const uuid = menuUuid.current
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
        arrangeLayer(uuid, { key: 'zIndex', value: 1 })
        break
      case 'index-down':
        arrangeLayer(uuid, { key: 'zIndex', value: -1 })
        break
      case 'index-front':
        arrangeLayer(uuid, { key: 'zOrder', value: 'front' })
        break
      case 'index-back':
        arrangeLayer(uuid, { key: 'zOrder', value: 'back' })
        break
      case 'lock':
        arrangeLayer(uuid, { key: 'lock', value: 'toggle' })
        break
      case 'duplicate':
        recordHistory(duplicateOne)
        break
      case 'hide':
        // The whole selection, or the one layer: hiding four things one at a
        // time from a menu that offered to hide them together is not the offer.
        recordHistory(() => {
          const targets = widgetState.dSelectWidgets.length > 0 ? widgetState.dSelectWidgets.map((item) => item.uuid) : [uuid]
          targets.forEach((item) => item !== '-1' && setLayerHidden({ uuid: item, hidden: true }))
        })
        break
      case 'del':
        deleteWidget()
        break
      case 'group':
        recordHistory(realCombined)
        break
      case 'ungroup':
        ungroup(uuid)
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
