import { useSnapshot } from 'valtio'
import localization from '@/assets/data/QrCodeLocalization'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import Select from '@/components/ui/Select'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import { widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { updateWidgetData } from '@/store/widget'
import ColorSelect from '../../settings/ColorSelect'
import ArrangeRow from '../../settings/ArrangeRow'
import NumberSlider from '../../settings/NumberSlider'
import OpacityRow from '../../settings/OpacityRow'
import TextInputArea from '../../settings/TextInputArea'
import TransformGrid from '../../settings/TransformGrid'
import './wQrcodeStyle.less'

export default function WQrcodeStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function uploadImgDone(img: TUploadDoneData) {
    setShowMoveable(false)
    finish('url', img.url)
    setShowMoveable(true)
  }

  return (
    <div className="ds-qrcode-style">
      <PanelSection title="Transform">
        <TransformGrid active={active} onChange={finish} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" />
      </PanelSection>
      <PanelSection title="Style">
        <div className="line-layout line-layout--tight">
          <Select value={active.dotColorType} options={localization.dotColorTypes.map((c) => ({ label: c.value, value: c.key }))} onChange={(value) => finish('dotColorType', value)} />
          <Select className="selector" value={active.dotType} options={localization.dotTypes.map((d) => ({ label: d.value, value: d.key }))} onChange={(value) => finish('dotType', value)} />
        </div>
        <div className="line-layout line-layout--tight panel-gap">
          <ColorSelect value={active.dotColor} onValueChange={(value) => finish('dotColor', value)} />
          <div style={{ display: active.dotColorType !== 'single' ? undefined : 'none', width: '100%' }}>
            <ColorSelect value={active.dotColor2} onValueChange={(value) => finish('dotColor2', value)} />
          </div>
        </div>
        <div style={{ display: active.dotColorType !== 'single' ? undefined : 'none' }}>
          <NumberSlider value={active.dotRotation} style={{ marginTop: 8 }} label="Gradient angle" step={1} minValue={0} maxValue={360} onChange={(value) => finish('dotRotation', value)} />
        </div>
      </PanelSection>
      <PanelSection title="Content">
        <TextInputArea value={active.value} max={40} label="" onChange={(value) => finish('value', value)} />
        <br />
        <div className="slide-wrap logo__layout">
          {active.url ? <img src={active.url} className="logo" /> : null}
          <Uploader className="options__upload" onDone={uploadImgDone}>
            <Button size="small" plain>
              {active.url ? 'Replace image' : 'Upload logo'}
            </Button>
          </Uploader>
          {active.url ? (
            <Button size="small" link onClick={() => finish('url', '')}>
              Delete
            </Button>
          ) : null}
        </div>
        <br />
        <div className="slide-wrap">
          <OpacityRow value={active.opacity} onChange={(value) => finish('opacity', value)} />
        </div>
      </PanelSection>
    </div>
  )
}
