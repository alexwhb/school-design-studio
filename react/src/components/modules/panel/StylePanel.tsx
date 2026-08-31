import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import IconItemSelect, { type TIconItemSelectData } from '../settings/IconItemSelect'
import Button from '@/components/ui/Button'
import { widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { getCombined, realCombined } from '@/store/group'
import { setDWidgets, updateAlign } from '@/store/widget'
import type { TdWidgetData } from '@/store/types'
import LayerList from './components/LayerList'
import { styleComponents } from './styleRegistry'
import './stylePanel.less'

export default function StylePanel() {
  const [activeTab, setActiveTab] = useState(0)
  const [showGroupCombined, setShowGroupCombined] = useState(false)
  const snap = useSnapshot(widgetState)
  const activeType = snap.dActiveElement?.type
  const selectCount = snap.dSelectWidgets.length

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGroupCombined(selectCount > 1)
    }, 100)
    return () => clearTimeout(timer)
  }, [selectCount])

  function handleCombine() {
    realCombined()
  }

  function alignAction(item: TIconItemSelectData) {
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

  return (
    <div id="style-panel">
      <div className="style-tab">
        <span className={'tab' + (activeTab === 0 ? ' active-tab' : '')} onClick={() => setActiveTab(0)}>
          Settings
        </span>
        <span className={'tab' + (activeTab === 1 ? ' active-tab' : '')} onClick={() => setActiveTab(1)}>
          Layers
        </span>
      </div>
      <div className="style-wrap" style={{ display: activeTab === 0 ? undefined : 'none' }}>
        <div style={{ padding: '2rem 0', display: showGroupCombined ? undefined : 'none' }}>
          <Button plain type="primary" className="gounp__btn" onClick={handleCombine}>
            Group
          </Button>
          <IconItemSelect label="" data={alignIconList} onFinish={alignAction} />
        </div>
        {StyleComp ? (
          <div style={{ display: showGroupCombined ? 'none' : undefined }}>
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
