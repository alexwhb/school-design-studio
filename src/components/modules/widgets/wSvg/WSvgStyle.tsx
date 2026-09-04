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
import './wSvgStyle.less'

/**
 * A piece of line art. Its fill is a list rather than one colour — the artwork
 * names as many slots as it was drawn with — so the Fill row appears once per
 * slot, numbered when there is more than one.
 */
export default function WSvgStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any

  if (!active) return null

  const uuid = active.uuid as string
  const colors: string[] = active.colors || []

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function colorFinish(index: number, value: string) {
    const next = ((widgetState.dActiveElement as any)?.colors || []).slice()
    next[index] = value
    finish('colors', next)
  }

  return (
    <div className="ds-svg-style">
      <PanelSection title="Transform">
        <TransformGrid active={active} minSize={1} rotation onChange={finish} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" />
      </PanelSection>
      <PanelSection title="Appearance">
        <div className="slide-wrap">
          <OpacityRow value={active.opacity} onChange={(value) => finish('opacity', value)} />
          {colors.map((colour, index) => (
            <ColorSelect key={index} variant="row" label={colors.length > 1 ? `Fill ${index + 1}` : 'Fill'} value={colour} modes={['Solid', 'Gradient']} onValueChange={(value) => colorFinish(index, value)} />
          ))}
          <BorderControls width={active.borderWidth} color={active.borderColor} style={active.borderStyle} onChange={finish} />
        </div>
      </PanelSection>
      <PanelSection title="Effects">
        <ShadowSelect value={active.shadow} onChange={(value) => finish('shadow', value)} />
      </PanelSection>
    </div>
  )
}
