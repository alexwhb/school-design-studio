import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import IconItemSelect, { type TIconItemSelectData } from '../settings/IconItemSelect'
import AnimateWrap from '../settings/AnimateSelect/AnimateWrap'
import Button from '@/components/ui/Button'
import Segmented from '@/components/ui/Segmented'
import Tooltip from '@/components/ui/Tooltip'
import { ChevronLeftIcon, ChevronRightIcon, DistributeHorizontalIcon, DistributeVerticalIcon } from '@/components/ui/icons'
import { panelState, setRightOpen } from '@/store/panels'
import { widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { getCombined, realCombined } from '@/store/group'
import { distributeGeometry, setDWidgets, updateAlign } from '@/store/widget'
import type { TdWidgetData } from '@/store/types'
import LayerList from './components/LayerList'
import { styleComponents } from './styleRegistry'
import './stylePanel.less'

/** Evening out the gaps needs a gap on either side of something, so three widgets. */
const DISTRIBUTE_MINIMUM = 3

const distributeIconList: TIconItemSelectData[] = [
  { key: 'distribute', Icon: DistributeHorizontalIcon, tip: 'Distribute horizontally', value: 'horizontal' },
  { key: 'distribute', Icon: DistributeVerticalIcon, tip: 'Distribute vertically', value: 'vertical' },
]

export default function StylePanel() {
  const [activeTab, setActiveTab] = useState(0)
  const [showGroupCombined, setShowGroupCombined] = useState(false)
  const snap = useSnapshot(widgetState)
  const { rightOpen } = useSnapshot(panelState)
  const activeType = snap.dActiveElement?.type
  const activeUuid = snap.dActiveElement?.uuid
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

  const alignItems = useMemo(
    () => [...alignIconList, ...distributeIconList.map((item) => ({ ...item, disabled: selectCount < DISTRIBUTE_MINIMUM }))],
    [selectCount],
  )

  function alignAction(item: TIconItemSelectData) {
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
        <div className="multi-select" style={{ display: showGroupCombined ? undefined : 'none' }}>
          <Button plain type="primary" className="gounp__btn" onClick={handleCombine}>
            Group
          </Button>
          <IconItemSelect label="" data={alignItems} onFinish={alignAction} />
        </div>
        {animatable ? (
          <div className="animate-slot" style={{ display: showGroupCombined ? 'none' : undefined }}>
            <AnimateWrap key={activeUuid} widget={widgetState.dActiveElement as TdWidgetData} />
          </div>
        ) : null}
        {StyleComp ? (
          // `display: contents` rather than a plain box: every style panel is
          // `height: 100%`, and a percentage height resolves against the nearest
          // box — an ordinary wrapper here silently collapses all of them to
          // their content height.
          <div style={{ display: showGroupCombined ? 'none' : 'contents' }}>
            <StyleComp />
          </div>
        ) : null}
      </div>
      <div className="layer-wrap" style={{ display: activeTab === 1 ? undefined : 'none' }}>
        <LayerList data={widgetState.dWidgets} onChange={layerChange} />
      </div>
    </div>
  )
}
