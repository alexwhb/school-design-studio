import { useSnapshot } from 'valtio'
import { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { updateWidgetData } from '@/store/widget'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import ShapeStyle from '../shape/ShapeStyle'
import { MAX_SIDES, MIN_SIDES, readSides } from './polygonShape'
import './wPolygon.less'

/** A polygon, with the one section the other shapes have no use for: how many corners. */
export default function WPolygonStyle() {
  const active = useSnapshot(widgetState).dActiveElement as any
  if (!active) return null

  const uuid = active.uuid as string
  const sides = readSides(active)

  /** Whole corners only, and never fewer than a triangle. See polygonShape. */
  function sidesChange(value: number | string) {
    const next = Math.round(Number(value))
    if (!Number.isFinite(next)) return
    updateWidgetData({ uuid, key: 'sides', value: Math.min(Math.max(next, MIN_SIDES), MAX_SIDES) })
  }

  return (
    <ShapeStyle
      shape={
        // Two ways at one number, because they are wanted at different moments:
        // the slider to try shapes out, the box to type the one you already
        // know you want — a hundred corners is a long way along a panel-width
        // slider.
        <PanelSection name="3" title="Corners">
          <div className="polygon-sides">
            <span className="polygon-sides__hint">Drag the grip on the canvas, or set it here</span>
            <NumberInput value={sides} label="N" minValue={MIN_SIDES} maxValue={MAX_SIDES} onChange={sidesChange} />
          </div>
          <NumberSlider value={sides} label="Sides" minValue={MIN_SIDES} maxValue={MAX_SIDES} onChange={sidesChange} />
        </PanelSection>
      }
    />
  )
}
