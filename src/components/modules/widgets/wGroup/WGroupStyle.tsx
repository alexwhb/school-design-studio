import { useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import layerIconList from '@/assets/data/LayerIconList'
import Button from '@/components/ui/Button'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { ungroup, updateAlign, updateLayerIndex, updateWidgetData } from '@/store/widget'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import './wGroupStyle.less'

export default function WGroupStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any
  const [activeNames, setActiveNames] = useState<string[]>(['1', '2', '3', '4'])

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function layerAction(item: TIconItemSelectData) {
    updateLayerIndex({ uuid, value: Number(item.value), isGroup: true })
  }

  function alignAction(item: TIconItemSelectData) {
    updateAlign({ align: item.value as any, uuid })
  }

  return (
    <div id="w-group-style">
      <PanelSections value={activeNames} onChange={setActiveNames}>
        <PanelSection name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" onChange={(v) => finish('height', Number(v))} />
          </div>
        </PanelSection>
        <PanelSection name="2" title="Style">
          <Button className="block-btn" plain onClick={() => ungroup(String(uuid))}>
            Ungroup
          </Button>
          <NumberSlider
            value={active.opacity}
            className="style-item"
            label="Opacity"
            step={0.05}
            maxValue={1}
            onChange={(value) => finish('opacity', value)}
          />
          <IconItemSelect className="style-item" label="Arrange" data={layerIconList} onFinish={layerAction} />
          <IconItemSelect label="Align" data={alignIconList} onFinish={alignAction} />
        </PanelSection>
      </PanelSections>
    </div>
  )
}
