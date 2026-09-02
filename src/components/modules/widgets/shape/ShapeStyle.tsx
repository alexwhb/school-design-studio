/**
 * The settings panel a drawn shape gets: where it is, what it is filled with,
 * what it is outlined in, and the shadow it casts.
 *
 * Some shapes take a section of their own — the rectangle's corners, the
 * polygon's count of them — and an ellipse takes none, so the section is handed
 * in rather than assumed. Everything else they have in common, which is
 * everything else.
 */
import { useState, type ReactNode } from 'react'
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
import './shapeStyle.less'

/**
 * @param shape the one section this shape has that the others do not, if any.
 * It sits between the fill and the border, and should be `name="3"` so it opens
 * with the rest.
 */
export default function ShapeStyle({ shape }: { shape?: ReactNode }) {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any
  const [activeNames, setActiveNames] = useState<string[]>(['2', '3', '4', '5'])

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function layerAction(item: TIconItemSelectData) {
    updateLayerIndex({ uuid, value: Number(item.value) })
  }

  function alignAction(item: TIconItemSelectData) {
    updateAlign({ align: item.value as any, uuid })
  }

  return (
    <div className="ds-shape-style">
      <PanelSections value={activeNames} onChange={setActiveNames}>
        <PanelSection name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" minValue={1} onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" minValue={1} onChange={(v) => finish('height', Number(v))} />
          </div>
        </PanelSection>
        <PanelSection name="2" title="Fill">
          <ColorSelect value={active.color} modes={['Solid', 'Gradient']} onValueChange={(value) => finish('color', value)} />
          <div className="slide-wrap panel-gap">
            <NumberSlider value={active.opacity} label="Opacity" step={0.01} maxValue={1} onChange={(value) => finish('opacity', value)} />
          </div>
        </PanelSection>
        {shape}
        <PanelSection name="4" title="Border">
          <BorderControls width={active.borderWidth} color={active.borderColor} style={active.borderStyle} onChange={finish} />
        </PanelSection>
        <PanelSection name="5" title="Shadow">
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
