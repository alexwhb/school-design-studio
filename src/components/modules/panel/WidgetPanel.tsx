import { useRef } from 'react'
import { useSnapshot } from 'valtio'
import widgetClassifyListData from '@/assets/data/WidgetClassifyList'
import Tooltip from '@/components/ui/Tooltip'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { clickPanelTab, panelState, setLeftOpen } from '@/store/panels'
import { cx } from '@/utils/dom'
import { panelComponents } from './panelRegistry'
import './widgetPanel.less'

/**
 * A line under each panel's title saying what is in it, because the tab names
 * are one word each and "Photos" does not tell a teacher they are free to use.
 * Keyed by the component id rather than by the tab's name so that renaming a
 * tab does not silently drop its hint.
 */
const PANEL_HINTS: Record<string, string> = {
  'temp-list-wrap': 'posters · flyers · slides',
  'text-list-wrap': 'styles + effects',
  'graph-list-wrap': 'stickers · groups',
  'photo-list-wrap': 'free for schools',
  'user-wrap': 'from this computer',
  'tools-list-wrap': 'draw on the page',
  'brand-wrap': 'set by your school',
}

export default function WidgetPanel() {
  const panels = useSnapshot(panelState)
  const active = panels.activePanel
  // Panels are built the first time they are asked for and then left mounted,
  // so switching back to one you have already used does not fetch its list
  // again. Noted here rather than in an effect because the tab can be changed
  // from outside — the canvas dock asks for one over the event bus — and the
  // panel has to be in the tree by the time this render puts it on screen.
  const mounted = useRef(new Set<string>())
  mounted.current.add(active)

  const current = widgetClassifyListData.find((item) => item.component === active) ?? widgetClassifyListData[0]

  return (
    <div id="widget-panel">
      <div className="widget-classify">
        {/*
          The rail is how you reach every panel in the editor, so it is a tab
          list you can get to from the keyboard rather than a list of divs that
          only answer a mouse.
        */}
        <ul className="classify-wrap" role="tablist" aria-orientation="vertical" aria-label="Panels">
          {widgetClassifyListData.map((item, index) => {
            const selected = item.component === active && panels.leftOpen
            return (
              <li key={index} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cx('classify-item', { 'active-classify-item': selected })}
                  onClick={() => clickPanelTab(item.component)}
                >
                  <span className="icon-box">
                    {item.Icon ? <item.Icon className="rail-icon" /> : <i className={cx('iconfont', 'rail-icon', item.icon)} style={item.style} />}
                  </span>
                  <span className="classify-name">{item.name}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="widget-wrap" style={{ display: panels.leftOpen ? undefined : 'none' }}>
        <div className="panel-head">
          <span className="panel-head__title">{current?.name}</span>
          <div className="panel-head__meta">
            <span className="panel-head__hint">{PANEL_HINTS[active] || ''}</span>
            <Tooltip content="Hide panel" placement="bottom" showAfter={300}>
              <button type="button" className="panel-head__collapse" aria-label="Hide panel" onClick={() => setLeftOpen(false)}>
                <ChevronLeftIcon width={14} height={14} />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="widget-body">
          {widgetClassifyListData.map((item) => {
            if (!mounted.current.has(item.component)) return null
            const Comp = panelComponents[item.component]
            if (!Comp) return null
            return (
              <div key={item.component} style={{ display: item.component === active ? 'contents' : 'none' }}>
                <Comp />
              </div>
            )
          })}
        </div>
      </div>
      {/*
        With the panel away the rail stays put, and this strip takes its place
        rather than the canvas sliding under the tabs — so the way back is
        exactly where the panel's own edge was.
      */}
      {!panels.leftOpen ? (
        <Tooltip content="Show panel" placement="right" showAfter={300}>
          <button type="button" className="panel-strip" aria-label="Show panel" onClick={() => setLeftOpen(true)}>
            <ChevronRightIcon width={14} height={14} />
          </button>
        </Tooltip>
      ) : null}
    </div>
  )
}
