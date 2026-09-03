import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { getImage } from '@/common/methods/getImgDetail'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import { CornerRadiusIcon, CropIcon, ZoomIcon } from '@/components/ui/icons'
import PictureSelector, { type PictureSelectorHandle } from '@/components/business/picture-selector/PictureSelector'
import { canvasState, controlState, widgetState } from '@/store/state'
import { setCropUuid, setShowRotatable } from '@/store/control'
import { updateWidgetData, updateWidgetMultiple } from '@/store/widget'
import type { TGetImageListResult } from '@/api/material'
import BorderControls from '../../settings/BorderControls'
import ArrangeRow from '../../settings/ArrangeRow'
import { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import OpacityRow from '../../settings/OpacityRow'
import ShadowSelect from '../../settings/ShadowSelect'
import TransformGrid from '../../settings/TransformGrid'
import ContainerWrap from '../../settings/EffectSelect/ContainerWrap'
import ImageAdjust from './components/ImageAdjust'
import ImageBackground from './components/ImageBackground'
import InnerToolBar from './components/InnerToolBar'
import './wImageStyle.less'

const FLIP_ICONS: TIconItemSelectData[] = [
  { key: 'flip', icon: 'sd-zuoyoufanzhuan', extraIcon: true, tip: 'Flip horizontally', value: 'Y' },
  { key: 'flip', icon: 'sd-shangxiafanzhuan', extraIcon: true, tip: 'Flip vertically', value: 'X' },
]

export default function WImageStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any
  // Whether this image is being cropped is the canvas's business, and the canvas
  // keeps it here. Reading a flag off the widget instead let the two drift apart:
  // deselecting the image left the flag set, so selecting it again brought back
  // the Done button and the Scale slider with no crop editor behind them.
  const cropping = useSnapshot(controlState).dCropUuid === active?.uuid
  const canvasZoom = useSnapshot(canvasState).dZoom
  const [toolBarStyle, setToolBarStyle] = useState<Record<string, any>>({})
  const picBoxRef = useRef<PictureSelectorHandle | null>(null)
  const lastUuid = useRef<string | undefined>(undefined)

  useEffect(() => {
    if (!active) return
    if (active.uuid !== lastUuid.current && typeof lastUuid.current !== 'undefined') {
      imgCrop(false)
    }
    lastUuid.current = active.uuid
  }, [active?.uuid])

  // The bar is fixed to the viewport, so it has to be told where the frame is
  // every time the frame moves — the grips reshape it as you crop.
  useEffect(() => {
    if (!cropping) return
    const el = document.getElementById(active?.uuid || '')
    if (!el) return
    const { left, top } = el.getBoundingClientRect()
    setToolBarStyle({ left: left + 'px', top: top + 'px' })
  }, [cropping, active?.uuid, active?.left, active?.top, active?.width, active?.height, canvasZoom])

  useEffect(() => {
    return () => {
      setShowRotatable(true)
      setCropUuid('-1')
    }
  }, [])

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string = '', value: any = '') {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function finishSliceData(key: string, value: number) {
    const target = widgetState.dActiveElement
    if (!target) return
    const data = { ...(target.sliceData || {}) }
    data[key] = value
    updateWidgetData({ uuid, key: 'sliceData', value: data })
  }

  function flipAction(item: TIconItemSelectData) {
    finish(item.key || '', item.value === widgetState.dActiveElement?.flip ? null : item.value)
  }

  function changeContainer(setting: any) {
    finish('mask', setting.svgUrl)
  }

  async function selectDone(img: TGetImageListResult) {
    finish('imgUrl', img.url)
    // A different picture has no earlier version of itself, so Restore original
    // must not offer to put back the one this replaced.
    finish('originalImgUrl', null)
    const loadImg = await getImage(img.url)
    finish('width', (loadImg.width * canvasState.dZoom) / 100)
    finish('height', (loadImg.height * canvasState.dZoom) / 100)
  }

  function imgCrop(val: boolean) {
    setShowRotatable(!val)
    setCropUuid(val ? uuid : '-1')
  }

  // Cropping with the grips can leave the picture on a different scale each way,
  // and the slider is a single number: it moves both by the same factor, off the
  // tighter of the two, so the shape the grips gave the crop is kept.
  function changeScale(value: number) {
    const zoomX = Number(active.zoom) || 1
    const zoomY = Number(active.zoomY ?? active.zoom) || 1
    const factor = value / Math.min(zoomX, zoomY)
    if (!Number.isFinite(factor) || factor <= 0) return
    updateWidgetMultiple({
      uuid,
      data: [
        { key: 'zoom', value: zoomX * factor },
        { key: 'zoomY', value: zoomY * factor },
      ],
    })
  }

  function openPicBox() {
    picBoxRef.current?.open()
  }

  const radiusMax = Math.min(Number(active.record?.width), Number(active.record?.height))

  return (
    <div className="ds-image-style">
      <PanelSection title="Crop &amp; fit">
        <div className="image-actions">
          <Button plain onClick={openPicBox}>
            Replace image
          </Button>
          {cropping ? (
            <Button plain type="primary" onClick={() => imgCrop(false)}>
              Done
            </Button>
          ) : (
            <Button plain type="primary" onClick={() => imgCrop(true)}>
              <CropIcon />
              Crop
            </Button>
          )}
        </div>
        {/* The picture inside its frame, which is only a thing while there is a
            frame to move it in. */}
        {cropping ? (
          <div className="image-zoom">
            <span className="image-zoom__icon" aria-hidden="true">
              <ZoomIcon />
            </span>
            <NumberSlider
              className="image-zoom__slider"
              value={Math.min(Number(active.zoom) || 1, Number(active.zoomY ?? active.zoom) || 1)}
              label="Zoom"
              step={0.01}
              minValue={1}
              maxValue={3}
              onChange={changeScale}
            />
          </div>
        ) : null}
        <ContainerWrap value={active.mask} onChange={changeContainer} />
      </PanelSection>

      <PanelSection title="Corners">
        <div className="image-corners">
          <span className="image-corners__icon" aria-hidden="true">
            <CornerRadiusIcon />
          </span>
          <NumberInput variant="underline" value={Math.round(Number(active.radius) || 0)} suffix="px" minValue={0} maxValue={Math.round(radiusMax)} onChange={(value) => finish('radius', Number(value))} />
        </div>
        <p className="image-corners__hint">Drag the round handle inside the photo&rsquo;s corner. All the way in gives you a pill — or a circle when the photo is square.</p>
      </PanelSection>

      <PanelSection title="Transform">
        <TransformGrid active={active} rotation onChange={finish} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" extra={FLIP_ICONS} onExtra={flipAction} />
      </PanelSection>

      <PanelSection title="Appearance">
        <div className="slide-wrap">
          <OpacityRow value={active.opacity} onChange={(value) => finish('opacity', value)} />
          <BorderControls label="Keyline" width={active.borderWidth} color={active.borderColor} style={active.borderStyle} onChange={finish} />
        </div>
      </PanelSection>

      <PanelSection title="Effects">
        <ShadowSelect value={active.shadow} onChange={(value) => finish('shadow', value)} />
      </PanelSection>

      {active.isNinePatch ? (
        <PanelSection title="Nine-patch settings">
          <div className="slide-wrap">
            <NumberSlider value={active.sliceData?.ratio} step={0.01} label="Ratio" maxValue={10} onChange={(value) => finishSliceData('ratio', value)} />
            <NumberSlider value={active.sliceData?.left} step={0.5} label="Size" onChange={(value) => finishSliceData('left', value)} />
          </div>
        </PanelSection>
      ) : null}

      <ImageAdjust uuid={uuid} filters={active.filters} />
      <ImageBackground key={uuid} uuid={uuid} imgUrl={active.imgUrl} originalImgUrl={active.originalImgUrl} />
      {cropping ? (
        <InnerToolBar style={toolBarStyle}>
          <NumberSlider
            value={Math.min(Number(active.zoom) || 1, Number(active.zoomY ?? active.zoom) || 1)}
            className="inner-bar"
            label="Scale"
            step={0.01}
            minValue={1}
            maxValue={3}
            onChange={changeScale}
          />
          <i style={{ padding: '0 8px', cursor: 'pointer' }} className="icon sd-queren" onClick={() => imgCrop(false)} />
        </InnerToolBar>
      ) : null}
      <PictureSelector ref={picBoxRef} onSelect={selectDone} />
    </div>
  )
}
