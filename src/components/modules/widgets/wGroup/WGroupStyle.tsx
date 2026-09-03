import { useSnapshot } from 'valtio'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import { widgetState } from '@/store/state'
import { ungroup, updateWidgetData } from '@/store/widget'
import ArrangeRow from '../../settings/ArrangeRow'
import OpacityRow from '../../settings/OpacityRow'
import TransformGrid from '../../settings/TransformGrid'
import './wGroupStyle.less'

/** Several things treated as one: where they sit, how solid they are, and the way out. */
export default function WGroupStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  return (
    <div id="w-group-style">
      <PanelSection title="Transform">
        <TransformGrid active={active} onChange={finish} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" />
      </PanelSection>
      <PanelSection title="Appearance">
        <div className="slide-wrap">
          <OpacityRow value={active.opacity} onChange={(value) => finish('opacity', value)} />
          <Button className="block-btn" plain onClick={() => ungroup(String(uuid))}>
            Ungroup
          </Button>
        </div>
      </PanelSection>
    </div>
  )
}
