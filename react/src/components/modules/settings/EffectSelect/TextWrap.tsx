import { useEffect, useMemo, useRef, useState } from 'react'
import api from '@/api'
import type { TGetCompListResult } from '@/api/home'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Popover from '@/components/ui/Popover'
import { CollapseItem } from '@/components/ui/Collapse'
import SortableList from '@/components/ui/SortableList'
import getGradientOrImg from '../../widgets/wText/getGradientOrImg'
import ColorSelect, { type colorChangeData } from '../ColorSelect'
import NumberInput from '../NumberInput'
import NumberSlider from '../NumberSlider'
import { cx } from '@/utils/dom'
import './textWrap.less'

let frozeFontEffectList: TGetCompListResult[] = []

type Props = {
  value?: Record<string, any>[]
  data: Record<string, any>
  degree?: string | number
  onValueChange?: (value: Record<string, any>[]) => void
}

const coefficient = Math.round(160 / 27)

export default function TextWrap({ value, data = {}, onValueChange }: Props) {
  const [strength, setStrength] = useState(50)
  const [visible, setVisible] = useState(false)
  const [list, setList] = useState<TGetCompListResult[]>([])
  const [layers, setLayers] = useState<Record<string, any>[]>([])
  const [unfold, setUnfold] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState<string[]>([])
  const rawData = useRef<Record<string, any>[]>([])
  const emitting = useRef(false)
  const uuidRef = useRef(data.uuid)

  useEffect(() => {
    if (uuidRef.current === data.uuid && layers.length) return
    uuidRef.current = data.uuid
    if (!data.textEffects) {
      setLayers([])
      rawData.current = []
      return
    }
    const clone = (JSON.parse(JSON.stringify(data.textEffects)) || [])
      .map((x: any) => {
        x.uuid = String(Math.random())
        return x
      })
      .reverse()
    setLayers(clone)
    rawData.current = JSON.parse(JSON.stringify(clone))
  }, [data.uuid, data.textEffects])

  function pushLayers(next: Record<string, any>[]) {
    setLayers(next)
    emitting.current = true
    const newEffect = next.map((x) => {
      const copy = { ...x }
      delete copy.uuid
      return copy
    })
    onValueChange?.(newEffect.slice().reverse())
  }

  function strengthChange(x: number) {
    setStrength(x)
    const effectScale = 1 + (x - 50) / 50
    const next = layers.map((item, index) => {
      const copy = { ...item }
      if (copy.stroke && rawData.current[index]?.stroke) {
        copy.stroke = { ...copy.stroke, width: rawData.current[index].stroke.width * effectScale }
      }
      if (copy.shadow && rawData.current[index]?.shadow) {
        copy.shadow = { ...copy.shadow, blur: rawData.current[index].shadow.blur * effectScale }
      }
      return copy
    })
    pushLayers(next)
  }

  const selectEffect = async (id?: number) => {
    setVisible(false)
    if (id) {
      const { data: detail } = await api.home.getTempDetail({ id, type: 1 })
      const next = JSON.parse(detail)
        .textEffects.map((x: Record<string, any>) => {
          x.uuid = String(Math.random())
          return x
        })
        .reverse()
      rawData.current = JSON.parse(JSON.stringify(next))
      pushLayers(next)
    } else {
      rawData.current = []
      pushLayers([])
    }
  }

  const removeLayer = (i: number) => {
    const next = layers.slice()
    next.splice(i, 1)
    rawData.current = JSON.parse(JSON.stringify(next))
    pushLayers(next)
  }

  const addLayer = () => {
    const filling = { enable: false, type: 0, color: '#000000ff' }
    const stroke = { enable: false, width: 0, color: '#000000ff', type: 'outer' }
    const offset = { enable: false, x: 0, y: 0 }
    const shadow = { enable: false, color: '#000000ff', offsetX: 0, offsetY: 0, blur: 0, opacity: 0 }
    const next = [{ filling, stroke, shadow, offset, uuid: String(Math.random()) }, ...layers]
    rawData.current = JSON.parse(JSON.stringify(next))
    pushLayers(next)
  }

  const openSet = async () => {
    const next = !visible
    setVisible(next)
    if (!next) return
    if (frozeFontEffectList.length <= 0) {
      const { list: fetched } = await api.home.getCompList({ cate: 12, type: 1, pageSize: 30 })
      setList(fetched)
      frozeFontEffectList = fetched
    } else setList(frozeFontEffectList)
  }

  function patchLayer(index: number, patch: Record<string, any>) {
    const next = layers.slice()
    next[index] = { ...next[index], ...patch }
    pushLayers(next)
  }

  function colorChange(e: colorChangeData, index: number, key: string) {
    const modeStr: Record<string, number> = { Gradient: 2, Solid: 0 }
    const layer = layers[index]
    const feature = { ...layer[key], gradient: { angle: e.angle, stops: e.stops } }
    patchLayer(index, { [key]: feature })
    setTimeout(() => {
      setLayers((prev) => {
        const next = prev.slice()
        if (!next[index]) return prev
        next[index] = { ...next[index], [key]: { ...next[index][key], type: modeStr[e.mode] || 0 } }
        return next
      })
    }, 100)
  }

  const previewEffects = useMemo(() => value ?? [], [value])

  return (
    <div className="effects">
      <div className="effects__head">
        <span className="effects__title">Text effects</span>
        <div className="effects__head-right">
          <div
            className="effect-preview"
            style={{
              position: 'relative',
              width: '22px',
              fontSize: '22px',
              color: data.color,
              fontWeight: data.fontWeight,
              fontStyle: data.fontStyle,
              textDecoration: data.textDecoration,
              opacity: data.opacity,
              backgroundColor: data.backgroundColor,
            }}
          >
            {previewEffects.map((ef: any, efi: number) => (
              <div
                key={efi + 'effect'}
                style={{
                  color: ef.filling && ef.filling.enable && ef.filling.type === 0 ? ef.filling.color : 'transparent',
                  WebkitTextStroke: ef.stroke && ef.stroke.enable ? `${ef.stroke.width / coefficient}px ${ef.stroke.color}` : '',
                  textShadow:
                    ef.shadow && ef.shadow.enable
                      ? `${ef.shadow.offsetX / coefficient}px ${ef.shadow.offsetY / coefficient}px ${ef.shadow.blur / coefficient}px ${ef.shadow.color}`
                      : undefined,
                  backgroundImage: ef.filling && ef.filling.enable ? (ef.filling.type === 0 ? undefined : getGradientOrImg(ef)) : undefined,
                  WebkitBackgroundClip: ef.filling && ef.filling.enable ? (ef.filling.type === 0 ? undefined : 'text') : undefined,
                }}
                className="demo"
              >
                A
              </div>
            ))}
            A
          </div>
          <Popover
            placement="left"
            width={220}
            open={visible}
            onOpenChange={setVisible}
            content={
              <div className="select__box">
                <div className="select__box__select-item" onClick={() => selectEffect()}>
                  None
                </div>
                {list.map((l, li) => (
                  <div key={'list' + li} className="select__box__select-item" onClick={() => selectEffect(l.id)}>
                    <img src={l.cover} />
                  </div>
                ))}
              </div>
            }
          >
            <Button className="effects__choose" link onClick={openSet}>
              {visible ? 'Cancel' : 'Choose'}
            </Button>
          </Popover>
        </div>
      </div>

      <div style={{ display: layers.length > 0 ? undefined : 'none' }}>
        <NumberSlider
          value={strength}
          className="effects__intensity"
          style={{ marginTop: 10 }}
          label="Intensity"
          minValue={0}
          maxValue={100}
          onChange={strengthChange}
        />
      </div>

      <div className="advanced">
        <CollapseItem
          name="advanced"
          title="Advanced"
          active={advancedOpen.includes('advanced')}
          onToggle={() => setAdvancedOpen((prev) => (prev.includes('advanced') ? [] : ['advanced']))}
        >
          <div className="advanced__actions">
            <Button className="advanced__action" size="small" type="primary" link onClick={addLayer}>
              + Add effect
            </Button>
            {layers.length > 0 ? (
              <Button className="advanced__action" size="small" type="primary" link onClick={() => setUnfold(!unfold)}>
                {unfold ? 'Collapse all' : 'Expand all'}
              </Button>
            ) : null}
          </div>
          <SortableList
            className="layers"
            handle=".sd-yidong"
            items={layers}
            getKey={(item) => item.uuid}
            onReorder={pushLayers}
            renderItem={(element, index) => (
              <div className="layer">
                <div className="layer__title">
                  <i className="icon sd-yidong" />
                  <span className="layer__name">Effect {index + 1}</span>
                  <i className="icon sd-delete" onClick={() => removeLayer(index)} />
                </div>
                <div className="layer__body" style={{ display: unfold ? undefined : 'none' }}>
                  {element.filling && [0, 2, '0', '2'].includes(element.filling.type) ? (
                    <div className={cx('feature', { 'feature--off': !element.filling.enable })}>
                      <div className="feature__row">
                        <Checkbox
                          value={!!element.filling.enable}
                          label="Fill"
                          onChange={(next) => patchLayer(index, { filling: { ...element.filling, enable: next } })}
                        />
                        <ColorSelect
                          value={element.filling.color}
                          width="32px"
                          modes={['Solid', 'Gradient']}
                          label=""
                          onValueChange={(next) => patchLayer(index, { filling: { ...element.filling, color: next } })}
                          onChange={(e) => colorChange(e, index, 'filling')}
                        />
                      </div>
                    </div>
                  ) : null}
                  {element.stroke ? (
                    <div className={cx('feature', { 'feature--off': !element.stroke.enable })}>
                      <div className="feature__row">
                        <Checkbox
                          value={!!element.stroke.enable}
                          label="Outline"
                          onChange={(next) => patchLayer(index, { stroke: { ...element.stroke, enable: next } })}
                        />
                        <ColorSelect
                          value={element.stroke.color}
                          width="32px"
                          label=""
                          onValueChange={(next) => patchLayer(index, { stroke: { ...element.stroke, color: next } })}
                        />
                      </div>
                      <div className="feature__fields">
                        <label className="field">
                          <span className="field__label">Width</span>
                          <NumberInput
                            value={element.stroke.width}
                            minValue={0}
                            type="simple"
                            onChange={(next) => patchLayer(index, { stroke: { ...element.stroke, width: Number(next) } })}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                  {element.offset ? (
                    <div className={cx('feature', { 'feature--off': !element.offset.enable })}>
                      <div className="feature__row">
                        <Checkbox
                          value={!!element.offset.enable}
                          label="Offset"
                          onChange={(next) => patchLayer(index, { offset: { ...element.offset, enable: next } })}
                        />
                      </div>
                      <div className="feature__fields">
                        <label className="field">
                          <span className="field__label">X</span>
                          <NumberInput
                            value={element.offset.x}
                            type="simple"
                            onChange={(next) => patchLayer(index, { offset: { ...element.offset, x: Number(next) } })}
                          />
                        </label>
                        <label className="field">
                          <span className="field__label">Y</span>
                          <NumberInput
                            value={element.offset.y}
                            type="simple"
                            onChange={(next) => patchLayer(index, { offset: { ...element.offset, y: Number(next) } })}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                  {element.shadow ? (
                    <div className={cx('feature', { 'feature--off': !element.shadow.enable })}>
                      <div className="feature__row">
                        <Checkbox
                          value={!!element.shadow.enable}
                          label="Shadow"
                          onChange={(next) => patchLayer(index, { shadow: { ...element.shadow, enable: next } })}
                        />
                        <ColorSelect
                          value={element.shadow.color}
                          width="32px"
                          label=""
                          onValueChange={(next) => patchLayer(index, { shadow: { ...element.shadow, color: next } })}
                        />
                      </div>
                      <div className="feature__fields">
                        <label className="field field--full">
                          <span className="field__label">Blur</span>
                          <NumberInput
                            value={element.shadow.blur}
                            minValue={0}
                            type="simple"
                            onChange={(next) => patchLayer(index, { shadow: { ...element.shadow, blur: Number(next) } })}
                          />
                        </label>
                        <label className="field">
                          <span className="field__label">X</span>
                          <NumberInput
                            value={element.shadow.offsetX}
                            type="simple"
                            onChange={(next) => patchLayer(index, { shadow: { ...element.shadow, offsetX: Number(next) } })}
                          />
                        </label>
                        <label className="field">
                          <span className="field__label">Y</span>
                          <NumberInput
                            value={element.shadow.offsetY}
                            type="simple"
                            onChange={(next) => patchLayer(index, { shadow: { ...element.shadow, offsetY: Number(next) } })}
                          />
                        </label>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          />
        </CollapseItem>
      </div>
    </div>
  )
}
