import { useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import layerIconList from '@/assets/data/LayerIconList'
import localization from '@/assets/data/QrCodeLocalization'
import Button from '@/components/ui/Button'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
import Select from '@/components/ui/Select'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import { widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { setUpdateRect } from '@/store/force'
import { updateAlign, updateLayerIndex, updateWidgetData } from '@/store/widget'
import ColorSelect from '../../settings/ColorSelect'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import TextInputArea from '../../settings/TextInputArea'
import './wQrcodeStyle.less'

export default function WQrcodeStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any
  const [activeNames, setActiveNames] = useState<string[]>(['2', '3', '4'])

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
    requestAnimationFrame(() => setUpdateRect())
  }

  function uploadImgDone(img: TUploadDoneData) {
    setShowMoveable(false)
    finish('url', img.url)
    setShowMoveable(true)
  }

  return (
    <div id="w-image-style" className="ds-qrcode-style">
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
          <div style={{ flexWrap: 'nowrap' }} className="line-layout">
            <Select
              value={active.dotColorType}
              options={localization.dotColorTypes.map((c) => ({ label: c.value, value: c.key }))}
              onChange={(value) => finish('dotColorType', value)}
            />
            <Select
              className="selector"
              value={active.dotType}
              options={localization.dotTypes.map((d) => ({ label: d.value, value: d.key }))}
              onChange={(value) => finish('dotType', value)}
            />
          </div>
          <div style={{ flexWrap: 'nowrap', marginTop: '1rem' }} className="line-layout">
            <ColorSelect value={active.dotColor} onValueChange={(value) => finish('dotColor', value)} />
            <div style={{ display: active.dotColorType !== 'single' ? undefined : 'none', width: '100%' }}>
              <ColorSelect value={active.dotColor2} onValueChange={(value) => finish('dotColor2', value)} />
            </div>
          </div>
          <div style={{ display: active.dotColorType !== 'single' ? undefined : 'none' }}>
            <NumberSlider
              value={active.dotRotation}
              style={{ marginTop: 8 }}
              label="Gradient angle"
              step={1}
              minValue={0}
              maxValue={360}
              onChange={(value) => finish('dotRotation', value)}
            />
          </div>
        </PanelSection>
        <PanelSection name="3" title="Content">
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
            <NumberSlider value={active.opacity} label="Opacity" step={0.01} maxValue={1} onChange={(value) => finish('opacity', value)} />
          </div>
        </PanelSection>
        <br />
        <IconItemSelect className="style-item" label="" data={layerIconList} onFinish={layerAction} />
        <IconItemSelect data={alignIconList} onFinish={alignAction} />
        <br />
      </PanelSections>
    </div>
  )
}
