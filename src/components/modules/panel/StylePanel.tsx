import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import AlignRow from '../settings/AlignRow'
import SelectionHeader from '../settings/SelectionHeader'
import { type TIconItemSelectData } from '../settings/IconItemSelect'
import AnimateWrap from '../settings/AnimateSelect/AnimateWrap'
import Button from '@/components/ui/Button'
import Segmented from '@/components/ui/Segmented'
import Tooltip from '@/components/ui/Tooltip'
import { ChevronLeftIcon, ChevronRightIcon } from '@/components/ui/icons'
import { panelState, setRightOpen } from '@/store/panels'
import { widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { setUpdateRect } from '@/store/force'
import { getCombined, realCombined } from '@/store/group'
import { distributeGeometry, setDWidgets, updateAlign } from '@/store/widget'
import type { TdWidgetData } from '@/store/types'
import LayerList from './components/LayerList'
import { styleComponents } from './styleRegistry'
import './stylePanel.less'

/** Evening out the gaps needs a gap on either side of something, so three widgets. */
const DISTRIBUTE_MINIMUM = 3

export default function StylePanel() {
  const [activeTab, setActiveTab] = useState(0)
  const [showGroupCombined, setShowGroupCombined] = useState(false)
  const snap = useSnapshot(widgetState)
  const { rightOpen } = useSnapshot(panelState)
  const active = snap.dActiveElement
  const activeType = active?.type
  const activeUuid = active?.uuid
  const selectCount = snap.dSelectWidgets.length
  /** The page has no entrance of its own; everything drawn on it does. */
  const animatable = !!activeType && activeType !== 'page'

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGroupCombined(selectCount > 1)
    }, 100)
    return () => clearTimeout(timer)
  }, [selectCount])

  function handleCombine() {
    realCombined()
  }

  /**
   * Lining up more than one thing measures them against the box the selection
   * makes, so the group has to be worked out before anything moves.
   */
  function alignSelection(item: TIconItemSelectData) {
    if (item.key === 'distribute') {
      distributeGeometry({ distribute: item.value as any, uuids: widgetState.dSelectWidgets.map((widget) => widget.uuid) })
      return
    }
    const sWidgets: TdWidgetData[] = JSON.parse(JSON.stringify(widgetState.dSelectWidgets))
    getCombined().then((group) => {
      sWidgets.forEach((element) => {
        updateAlign({ align: item.value as any, uuid: element.uuid, group })
      })
    })
  }

  /** One thing lines up against the page. */
  function alignOne(item: TIconItemSelectData) {
    if (!activeUuid) return
    updateAlign({ align: item.value as any, uuid: activeUuid })
    // The layer has moved but the selection box has not; it is measured from the
    // element, so it has to be told to look again.
    requestAnimationFrame(() => setUpdateRect())
  }

  function layerChange(newLayer: TdWidgetData[]) {
    setDWidgets(newLayer.slice().reverse())
    setShowMoveable(false)
  }

  const StyleComp = activeType ? styleComponents[`${activeType}-style`] : undefined

  // With the panel away this strip holds its edge, so the way back is where the
  // panel itself was rather than somewhere over the artwork.
  if (!rightOpen) {
    return (
      <Tooltip content="Show panel" placement="left" showAfter={300}>
        <button type="button" className="style-panel-strip" aria-label="Show panel" onClick={() => setRightOpen(true)}>
          <ChevronLeftIcon width={14} height={14} />
        </button>
      </Tooltip>
    )
  }

  return (
    <div id="style-panel">
      <div className="style-tab">
        <Segmented
          className="style-tab__switch"
          aria-label="Panel"
          value={activeTab === 0 ? 'design' : 'layers'}
          options={[
            { label: 'Design', value: 'design' },
            { label: 'Layers', value: 'layers' },
          ]}
          onChange={(next) => setActiveTab(next === 'design' ? 0 : 1)}
        />
        <Tooltip content="Hide panel" placement="bottom" showAfter={300}>
          <button type="button" className="style-tab__collapse" aria-label="Hide panel" onClick={() => setRightOpen(false)}>
            <ChevronRightIcon width={14} height={14} />
          </button>
        </Tooltip>
      </div>
      <div className="style-wrap" style={{ display: activeTab === 0 ? undefined : 'none' }}>
        {showGroupCombined ? (
          <div className="multi-select">
            <Button plain type="primary" className="gounp__btn" onClick={handleCombine}>
              Group
            </Button>
            <AlignRow distribute distributeDisabled={selectCount < DISTRIBUTE_MINIMUM} onFinish={alignSelection} />
            <span className="panel-rule" />
          </div>
        ) : activeType === 'page' ? (
          // The page is what the panel falls back to, so it says so rather than
          // opening on a heading that looks like it belongs to something.
          <p className="style-empty">Nothing selected</p>
        ) : active ? (
          <div className="selection-block">
            <SelectionHeader element={active as TdWidgetData} />
            <AlignRow onFinish={alignOne} />
            <span className="panel-rule" />
          </div>
        ) : null}
        {StyleComp ? (
          // `display: contents`, so the panel is a direct child of the scroll
          // box and the animation slot below it follows in the same flow. The
          // panels size to their content: a fixed height here would leave the
          // slot drawn over whatever ran past it.
          <div style={{ display: showGroupCombined ? 'none' : 'contents' }}>
            <StyleComp />
          </div>
        ) : null}
        {animatable && !showGroupCombined ? (
          <div className="animate-slot">
            <span className="panel-rule" />
            <AnimateWrap key={activeUuid} widget={widgetState.dActiveElement as TdWidgetData} />
          </div>
        ) : null}
      </div>
      <div className="layer-wrap" style={{ display: activeTab === 1 ? undefined : 'none' }}>
        <LayerList data={widgetState.dWidgets} onChange={layerChange} />
      </div>
    </div>
  )
}
