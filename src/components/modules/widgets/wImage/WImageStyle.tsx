import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import layerIconList from '@/assets/data/LayerIconList'
import { getImage } from '@/common/methods/getImgDetail'
import Button from '@/components/ui/Button'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
import PictureSelector, { type PictureSelectorHandle } from '@/components/business/picture-selector/PictureSelector'
import { canvasState, controlState, widgetState } from '@/store/state'
import { setCropUuid, setShowRotatable } from '@/store/control'
import { setUpdateRect } from '@/store/force'
import { updateAlign, updateLayerIndex, updateWidgetData, updateWidgetMultiple } from '@/store/widget'
import type { TGetImageListResult } from '@/api/material'
import BorderControls from '../../settings/BorderControls'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import ShadowSelect from '../../settings/ShadowSelect'
import ContainerWrap from '../../settings/EffectSelect/ContainerWrap'
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
  const [activeNames, setActiveNames] = useState<string[]>(['2', '3', '4', '5', '6'])
  const [toolBarStyle, setToolBarStyle] = useState<Record<string, any>>({})
  const picBoxRef = useRef<PictureSelectorHandle | null>(null)
  const lastUuid = useRef<string | undefined>(undefined)

  const layerIcons = useMemo(() => layerIconList.concat(FLIP_ICONS), [])

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

  function layerAction(item: TIconItemSelectData) {
    if (item.key === 'zIndex') {
      updateLayerIndex({ uuid, value: Number(item.value) })
    } else {
      finish(item.key || '', item.value === widgetState.dActiveElement?.flip ? null : item.value)
    }
  }

  function alignAction(item: TIconItemSelectData) {
    updateAlign({ align: item.value as any, uuid })
    requestAnimationFrame(() => setUpdateRect())
  }

  function changeContainer(setting: any) {
    finish('mask', setting.svgUrl)
  }

  async function selectDone(img: TGetImageListResult) {
    finish('imgUrl', img.url)
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
      <PanelSections value={activeNames} onChange={setActiveNames}>
        <PanelSection name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" onChange={(v) => finish('height', Number(v))} />
          </div>
        </PanelSection>
        <PanelSection name="2" title="Settings">
          <Button style={{ width: '100%', marginBottom: 12 }} plain onClick={openPicBox}>
            Replace image
          </Button>
          <div className="options">
            {cropping ? (
              <Button plain type="primary" onClick={() => imgCrop(false)}>
                Done
              </Button>
            ) : (
              <Button plain type="primary" onClick={() => imgCrop(true)}>
                <i className="icon sd-caijian" />
                Crop
              </Button>
            )}
            <Button size="small" disabled plain>
              Enhance
            </Button>
          </div>
          <ContainerWrap onChange={changeContainer} />
          <div className="slide-wrap">
            <NumberSlider
              value={active.opacity}
              style={{ fontSize: 14 }}
              label="Opacity"
              step={0.05}
              maxValue={1}
              onChange={(value) => finish('opacity', value)}
            />
            <NumberSlider
              value={active.radius}
              style={{ fontSize: 14 }}
              label="Corner radius"
              maxValue={radiusMax}
              onChange={(value) => finish('radius', value)}
            />
          </div>
        </PanelSection>
        <PanelSection name="5" title="Border">
          <BorderControls
            width={active.borderWidth}
            color={active.borderColor}
            style={active.borderStyle}
            onChange={finish}
          />
        </PanelSection>
        {active.isNinePatch ? (
          <PanelSection name="3" title="Nine-patch settings">
            <NumberSlider
              value={active.sliceData?.ratio}
              step={0.01}
              label="Ratio"
              maxValue={10}
              onChange={(value) => finishSliceData('ratio', value)}
            />
            <NumberSlider
              value={active.sliceData?.left}
              step={0.5}
              label="Size"
              onChange={(value) => finishSliceData('left', value)}
            />
          </PanelSection>
        ) : null}
        <PanelSection name="6" title="Shadow">
          <div className="slide-wrap">
            <ShadowSelect value={active.shadow} onChange={(value) => finish('shadow', value)} />
          </div>
        </PanelSection>
        <br />
        <IconItemSelect className="style-item" label="Arrange" data={layerIcons} onFinish={layerAction} />
        <IconItemSelect data={alignIconList} onFinish={alignAction} />
        <br />
      </PanelSections>
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
