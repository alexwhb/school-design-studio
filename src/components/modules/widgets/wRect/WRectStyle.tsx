import { useSnapshot } from 'valtio'
import { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { updateWidgetData } from '@/store/widget'
import CornerRadius from '../../settings/CornerRadius'
import ShapeStyle from '../shape/ShapeStyle'
import { isUnlinked, maxRadius, readCorners, type TCorners } from './rectRadius'

/** A box, with the one section the other shapes have no use for: its corners. */
export default function WRectStyle() {
  const active = useSnapshot(widgetState).dActiveElement as any
  if (!active) return null

  const uuid = active.uuid as string

  /**
   * Linking is what a box holds, not what the panel remembers — see
   * CornerRadius. Letting the four go seeds them from what is drawn now, so the
   * box does not jump the moment the chain is broken; putting them back takes
   * the top-left, which is the one the eye lands on first.
   */
  function linkChange(next: boolean) {
    if (next) {
      updateWidgetData({ uuid, key: 'radii', value: readCorners(widgetState.dActiveElement) as TCorners })
      return
    }
    updateWidgetData({ uuid, key: 'radii', value: null })
    updateWidgetData({ uuid, key: 'radius', value: readCorners(widgetState.dActiveElement)[0] })
  }

  function radiusChange(index: number, value: number) {
    if (index < 0) {
      updateWidgetData({ uuid, key: 'radius', value })
      return
    }
    const next = readCorners(widgetState.dActiveElement) as TCorners
    next[index] = value
    updateWidgetData({ uuid, key: 'radii', value: next })
  }

  return (
    <ShapeStyle
      shape={
        <PanelSection title="Corners">
          <CornerRadius
            corners={readCorners(active)}
            unlinked={isUnlinked(active)}
            maxValue={Math.round(maxRadius(active.width, active.height))}
            onLinkChange={linkChange}
            onChange={radiusChange}
          />
        </PanelSection>
      }
    />
  )
}
