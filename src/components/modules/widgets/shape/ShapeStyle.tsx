/**
 * The settings panel a drawn shape gets: where it is, what it is filled with,
 * what it is outlined in, and the shadow it casts.
 *
 * A rectangle takes one section more than an ellipse — its corners — and an
 * ellipse has none to round, so the section is asked for rather than assumed.
 * Everything else the two have in common, which is everything else.
 */
import { useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import layerIconList from '@/assets/data/LayerIconList'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { updateAlign, updateLayerIndex, updateWidgetData } from '@/store/widget'
import BorderControls from '../../settings/BorderControls'
import ColorSelect from '../../settings/ColorSelect'
import CornerRadius from '../../settings/CornerRadius'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import ShadowSelect from '../../settings/ShadowSelect'
import { isUnlinked, maxRadius, readCorners, type TCorners } from '../wRect/rectRadius'
import './shapeStyle.less'

export default function ShapeStyle({ corners: hasCorners = false }: { corners?: boolean }) {
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

  /**
   * Linking is what a box holds, not what the panel remembers — see
   * CornerRadius. Letting the four go seeds them from what is drawn now, so the
   * box does not jump the moment the chain is broken; putting them back takes
   * the top-left, which is the one the eye lands on first.
   */
  function linkChange(next: boolean) {
    if (next) {
      finish('radii', readCorners(widgetState.dActiveElement) as TCorners)
      return
    }
    finish('radii', null)
    finish('radius', readCorners(widgetState.dActiveElement)[0])
  }

  function radiusChange(index: number, value: number) {
    if (index < 0) {
      finish('radius', value)
      return
    }
    const next = readCorners(widgetState.dActiveElement) as TCorners
    next[index] = value
    finish('radii', next)
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
        {hasCorners ? (
          <PanelSection name="3" title="Corners">
            <CornerRadius
              corners={readCorners(active)}
              unlinked={isUnlinked(active)}
              maxValue={Math.round(maxRadius(active.width, active.height))}
              onLinkChange={linkChange}
              onChange={radiusChange}
            />
          </PanelSection>
        ) : null}
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
