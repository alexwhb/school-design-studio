/**
 * The settings panel a drawn shape gets: where it is, what it is filled with,
 * what it is outlined in, and the shadow it casts.
 *
 * Some shapes take a section of their own — the rectangle's corners, the
 * polygon's count of them, a path's points — and an ellipse takes none, so the
 * section is handed in rather than assumed. Everything else they have in
 * common, which is everything else.
 *
 * Who it is and how it lines up are drawn by the panel above this, so every
 * kind of element carries the same header rather than each one repeating it.
 */
import type { ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { updateWidgetData } from '@/store/widget'
import ArrangeRow from '../../settings/ArrangeRow'
import BorderControls from '../../settings/BorderControls'
import ColorSelect from '../../settings/ColorSelect'
import OpacityRow from '../../settings/OpacityRow'
import ShadowSelect from '../../settings/ShadowSelect'
import TransformGrid from '../../settings/TransformGrid'
import { isPainted, withPaint } from '../../settings/paintToggle'
import './shapeStyle.less'

/**
 * @param shape the one section this shape has that the others do not, if any.
 * It sits between the transform and the appearance.
 */
export default function ShapeStyle({ shape }: { shape?: ReactNode }) {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  return (
    <div className="ds-shape-style">
      <PanelSection title="Transform">
        <TransformGrid active={active} minSize={1} rotation onChange={finish} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" />
      </PanelSection>
      {shape}
      <PanelSection title="Appearance">
        <div className="slide-wrap">
          <OpacityRow value={active.opacity} onChange={(value) => finish('opacity', value)} />
          <ColorSelect variant="row" label="Fill" value={active.color} enabled={isPainted(active.color)} onEnabledChange={(on) => finish('color', withPaint(active.color, on))} modes={['Solid', 'Gradient']} onValueChange={(value) => finish('color', value)} />
          <BorderControls width={active.borderWidth} color={active.borderColor} style={active.borderStyle} onChange={finish} />
        </div>
      </PanelSection>
      <PanelSection title="Effects">
        <ShadowSelect value={active.shadow} onChange={(value) => finish('shadow', value)} />
      </PanelSection>
    </div>
  )
}
