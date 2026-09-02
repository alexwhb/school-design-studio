import { useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import layerIconList from '@/assets/data/LayerIconList'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { updateAlign, updateLayerIndex, updateWidgetData } from '@/store/widget'
import BorderControls from '../../settings/BorderControls'
import ColorSelect from '../../settings/ColorSelect'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import ShadowSelect from '../../settings/ShadowSelect'
import './wSvgStyle.less'

export default function WSvgStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any
  const [activeNames, setActiveNames] = useState<string[]>(['2', '3', '4', '5', '6'])

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function colorFinish(index: number, value: string) {
    const colors = ((widgetState.dActiveElement as any)?.colors || []).slice()
    colors[index] = value
    finish('colors', colors)
  }

  function layerAction(item: TIconItemSelectData) {
    updateLayerIndex({ uuid, value: Number(item.value) })
  }

  function alignAction(item: TIconItemSelectData) {
    updateAlign({ align: item.value as any, uuid })
  }

  return (
    <div className="ds-svg-style">
      <PanelSections value={activeNames} onChange={setActiveNames}>
        <PanelSection name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" onChange={(v) => finish('height', Number(v))} />
          </div>
        </PanelSection>
        <PanelSection name="2" title="Fill">
          {(active.colors || []).map((c: string, ci: number) => (
            <div key={ci + 'c'}>
              <ColorSelect value={c} modes={['Solid', 'Gradient']} onValueChange={(value) => colorFinish(ci, value)} />
            </div>
          ))}
          <br />
          <div className="slide-wrap">
            <NumberSlider value={active.opacity} label="Opacity" step={0.01} maxValue={1} onChange={(value) => finish('opacity', value)} />
          </div>
        </PanelSection>
        <PanelSection name="3" title="Border">
          <BorderControls
            width={active.borderWidth}
            color={active.borderColor}
            style={active.borderStyle}
            onChange={finish}
          />
        </PanelSection>
        <PanelSection name="6" title="Shadow">
          <div className="slide-wrap">
            <ShadowSelect value={active.shadow} onChange={(value) => finish('shadow', value)} />
          </div>
        </PanelSection>
        <br />
        <IconItemSelect className="style-item" label="Arrange" data={layerIconList} onFinish={layerAction} />
        <IconItemSelect data={alignIconList} onFinish={alignAction} />
        <br />
      </PanelSections>
    </div>
  )
}
