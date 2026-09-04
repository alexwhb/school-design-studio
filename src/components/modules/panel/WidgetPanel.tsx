import { useMemo, useRef } from 'react'
import { useSnapshot } from 'valtio'
import widgetClassifyListData, { ASSISTANT_PANEL, type TWidgetClassifyData } from '@/assets/data/WidgetClassifyList'
import { useHostApi } from '@/common/hooks/hostApi'
import Tooltip from '@/components/ui/Tooltip'
import { ChevronLeftIcon, ChevronRightIcon, SparkleIcon } from '@/components/ui/icons'
import { documentKindState } from '@/store/documentKind'
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
  'brand-wrap': 'set by your school',
  [ASSISTANT_PANEL]: 'ask for a draft',
}

export default function WidgetPanel() {
  const panels = useSnapshot(panelState)
  const kind = useSnapshot(documentKindState).kind
  const { assistant } = useHostApi()
  const active = panels.activePanel

  // A host that brought its own panel gets the first tab in the rail, because
  // "ask for a draft" is where somebody starts rather than somewhere they go
  // back to. Without one there is no tab at all, which is what the standalone
  // editor should show.
  const tabs = useMemo<TWidgetClassifyData[]>(() => (assistant ? [{ name: 'AI', icon: '', Icon: SparkleIcon, show: false, component: ASSISTANT_PANEL }, ...widgetClassifyListData] : widgetClassifyListData), [assistant])
  // Panels are built the first time they are asked for and then left mounted,
  // so switching back to one you have already used does not fetch its list
  // again. Noted here rather than in an effect because the tab can be changed
  // from outside — the canvas dock asks for one over the event bus — and the
  // panel has to be in the tree by the time this render puts it on screen.
  const mounted = useRef(new Set<string>())
  mounted.current.add(active)

  const current = tabs.find((item) => item.component === active) ?? tabs[0]

  // The gallery's line has to say what is in the gallery. A host making a
  // presentation is not offered flyers, so promising them reads as a bug.
  const hint = active === 'temp-list-wrap' && kind ? (kind === 'poster' ? 'posters · flyers · signs' : 'slides and decks') : PANEL_HINTS[active] || ''

  return (
    <div id="widget-panel">
      <div className="widget-classify">
        {/*
          The rail is how you reach every panel in the editor, so it is a tab
          list you can get to from the keyboard rather than a list of divs that
          only answer a mouse.
        */}
        <ul className="classify-wrap" role="tablist" aria-orientation="vertical" aria-label="Panels">
          {tabs.map((item, index) => {
            const selected = item.component === active && panels.leftOpen
            return (
              <li key={index} role="presentation">
                <button type="button" role="tab" aria-selected={selected} className={cx('classify-item', { 'active-classify-item': selected })} onClick={() => clickPanelTab(item.component)}>
                  <span className="icon-box">{item.Icon ? <item.Icon className="rail-icon" /> : <i className={cx('iconfont', 'rail-icon', item.icon)} style={item.style} />}</span>
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
            <span className="panel-head__hint">{hint}</span>
            <Tooltip content="Hide panel" placement="bottom" showAfter={300}>
              <button type="button" className="panel-head__collapse" aria-label="Hide panel" onClick={() => setLeftOpen(false)}>
                <ChevronLeftIcon width={14} height={14} />
              </button>
            </Tooltip>
          </div>
        </div>
        <div className="widget-body">
          {tabs.map((item) => {
            if (!mounted.current.has(item.component)) return null
            // The host's panel is a node rather than a component: the studio
            // renders it at panel width and passes it nothing. Everything it
            // wants to do to the design it does through the component's ref.
            if (item.component === ASSISTANT_PANEL) {
              return (
                <div key={item.component} className="assistant-wrap" style={{ display: item.component === active ? undefined : 'none' }}>
                  {assistant}
                </div>
              )
            }
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
