import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import alignIconList from '@/assets/data/AlignListData'
import layerIconList from '@/assets/data/LayerIconList'
import { getImage } from '@/common/methods/getImgDetail'
import Button from '@/components/ui/Button'
import Collapse, { CollapseItem } from '@/components/ui/Collapse'
import PictureSelector, { type PictureSelectorHandle } from '@/components/business/picture-selector/PictureSelector'
import { canvasState, widgetState } from '@/store/state'
import { setCropUuid, setShowRotatable } from '@/store/control'
import { setUpdateRect } from '@/store/force'
import { updateAlign, updateLayerIndex, updateWidgetData } from '@/store/widget'
import type { TGetImageListResult } from '@/api/material'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
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
  const [activeNames, setActiveNames] = useState<string[]>(['2', '3', '4'])
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
    const el = document.getElementById(uuid || '')
    if (!el) return
    const { left, top } = el.getBoundingClientRect()
    setToolBarStyle({ left: left + 'px', top: top + 'px' })
    finish('cropEdit', val)
    setShowRotatable(!val)
    setCropUuid(val ? uuid : '-1')
  }

  function openPicBox() {
    picBoxRef.current?.open()
  }

  const radiusMax = Math.min(Number(active.record?.width), Number(active.record?.height))

  return (
    <div id="w-image-style" className="ds-image-style">
      <Collapse value={activeNames} onChange={setActiveNames}>
        <CollapseItem name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" onChange={(v) => finish('height', Number(v))} />
          </div>
        </CollapseItem>
        <CollapseItem name="2" title="Settings">
          <Button style={{ width: '100%', marginBottom: 12 }} plain onClick={openPicBox}>
            Replace image
          </Button>
          <div className="options">
            {active.cropEdit ? (
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
        </CollapseItem>
        {active.isNinePatch ? (
          <CollapseItem name="3" title="Nine-patch settings">
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
          </CollapseItem>
        ) : null}
        <br />
        <IconItemSelect className="style-item" label="" data={layerIcons} onFinish={layerAction} />
        <IconItemSelect data={alignIconList} onFinish={alignAction} />
        <br />
      </Collapse>
      {active.cropEdit ? (
        <InnerToolBar style={toolBarStyle}>
          <NumberSlider
            value={active.zoom}
            className="inner-bar"
            label="Scale"
            step={0.01}
            minValue={1}
            maxValue={3}
            onChange={(value) => finish('zoom', value)}
          />
          <i style={{ padding: '0 8px', cursor: 'pointer' }} className="icon sd-queren" onClick={() => imgCrop(false)} />
        </InnerToolBar>
      ) : null}
      <PictureSelector ref={picBoxRef} onSelect={selectDone} />
    </div>
  )
}
