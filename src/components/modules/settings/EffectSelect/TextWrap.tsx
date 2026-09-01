import { useEffect, useMemo, useRef, useState } from 'react'
import api from '@/api'
import type { TGetCompListResult } from '@/api/home'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Popover from '@/components/ui/Popover'
import { CollapseItem } from '@/components/ui/Collapse'
import SortableList from '@/components/ui/SortableList'
import effectStyle from '../../widgets/wText/effectStyle'
import getGradientOrImg from '../../widgets/wText/getGradientOrImg'
import ColorSelect, { type colorChangeData } from '../ColorSelect'
import NumberInput from '../NumberInput'
import NumberSlider from '../NumberSlider'
import { cx } from '@/utils/dom'
import './textWrap.less'

let frozeFontEffectList: TGetCompListResult[] = []

/**
 * Every feature a layer can carry. A preset only stores the parts it uses, and
 * an absent part means an absent control — pick the hard-shadow preset and
 * there would be no way to lean it, because it was saved before Skew existed.
 * Filling in the blanks on load is what keeps every layer fully editable.
 */
const emptyLayer = () => ({
  filling: { enable: false, type: 0, color: '#000000ff' },
  stroke: { enable: false, width: 0, color: '#000000ff', type: 'outer' },
  offset: { enable: false, x: 0, y: 0 },
  skew: { enable: false, x: 0, y: 0 },
  shadow: { enable: false, color: '#000000ff', offsetX: 0, offsetY: 0, blur: 0, opacity: 0 },
})

/** One stored layer, with anything it does not carry filled in and a drag key. */
const asLayer = (stored: Record<string, any>) => ({ ...emptyLayer(), ...stored, uuid: String(Math.random()) })

type Props = {
  value?: Record<string, any>[]
  data: Record<string, any>
  degree?: string | number
  onValueChange?: (value: Record<string, any>[]) => void
  /** A preset carries the colour it was drawn around; the widget needs it too. */
  onSelect?: (data: { key: string; value: string }) => void
}

const coefficient = Math.round(160 / 27)

export default function TextWrap({ value, data = {}, onValueChange, onSelect }: Props) {
  const [strength, setStrength] = useState(50)
  const [visible, setVisible] = useState(false)
  const [list, setList] = useState<TGetCompListResult[]>([])
  const [layers, setLayers] = useState<Record<string, any>[]>([])
  const [unfold, setUnfold] = useState(true)
  const [advancedOpen, setAdvancedOpen] = useState<string[]>([])
  const rawData = useRef<Record<string, any>[]>([])
  /**
   * The stack as it last passed between this panel and the widget. The settings
   * panel is one instance that is handed a different widget rather than rebuilt,
   * so the layers cannot be read once on mount — click a plain text widget after
   * an effect one and it would still be offering the previous widget's layers to
   * edit. This is what tells a stack arriving from outside apart from the echo
   * of one this panel just sent out.
   */
  const exchanged = useRef('')

  /** Loads a stack into the editable layer list, topmost layer first. */
  const load = (effects?: unknown) => {
    const stack = Array.isArray(effects) ? effects : []
    exchanged.current = JSON.stringify(stack)
    const next = JSON.parse(exchanged.current).map(asLayer).reverse()
    setLayers(next)
    rawData.current = JSON.parse(JSON.stringify(next))
    setStrength(50)
  }

  // Recolouring the text rewrites the stack, and so does picking a different
  // widget; either way the layer controls have to show what is actually there.
  useEffect(() => {
    if (JSON.stringify(Array.isArray(value) ? value : []) === exchanged.current) return
    load(value)
  }, [value])

  function pushLayers(next: Record<string, any>[]) {
    setLayers(next)
    const newEffect = next
      .map((x) => {
        const copy = { ...x }
        delete copy.uuid
        return copy
      })
      .reverse()
    const stack = JSON.stringify(newEffect)
    if (stack === exchanged.current) return
    exchanged.current = stack
    onValueChange?.(newEffect)
  }

  function strengthChange(x: number) {
    setStrength(x)
    const effectScale = 1 + (x - 50) / 50
    const next = layers.map((item, index) => {
      const copy = { ...item }
      if (!rawData.current[index]) return copy
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
      const preset = JSON.parse(detail)
      loadAndEmit(preset.textEffects)
      // A preset is a stack plus the colour it was drawn around, and the plain
      // text still paints under the stack — so the hollow one is only hollow if
      // the text below it goes transparent too. Without this it would come out
      // as black letters inside a red outline.
      preset.color && onSelect?.({ key: 'color', value: preset.color })
    } else {
      loadAndEmit([])
    }
  }

  /** Loads a stack into the panel and sends it on to the widget. */
  function loadAndEmit(effects?: unknown) {
    const stack = Array.isArray(effects) ? effects : []
    const next = JSON.parse(JSON.stringify(stack)).map(asLayer).reverse()
    rawData.current = JSON.parse(JSON.stringify(next))
    setStrength(50)
    pushLayers(next)
  }

  const removeLayer = (i: number) => {
    const next = layers.slice()
    next.splice(i, 1)
    rawData.current = JSON.parse(JSON.stringify(next))
    pushLayers(next)
  }

  const addLayer = () => {
    const next = [asLayer({}), ...layers]
    rawData.current = JSON.parse(JSON.stringify(next))
    pushLayers(next)
  }

  const openSet = async () => {
    const next = !visible
    setVisible(next)
    if (!next) return
    if (frozeFontEffectList.length <= 0) {
      // The same presets the Text panel offers under "Text with effects". This
      // asked for category 12 upstream, which is not a list this build ships, so
      // the picker came up empty and the only way to an effect was to build the
      // layers by hand.
      // One page, sized past the list rather than to it: the picker is a grid
      // with no paging of its own, so anything past the page size is a preset
      // nobody can reach.
      const { list: fetched } = await api.home.getCompList({ cate: 'text', type: 1, pageSize: 200 })
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

  /**
   * What the swatch opens on. The picker decides its own mode by parsing this
   * value, so handing it the flat colour of a gradient fill starts it in Solid —
   * and the change it reports on the way in then flattens the very fill it was
   * opened to show. Handing it the gradient instead starts it in the right mode
   * and the round trip leaves the fill alone.
   */
  const fillValue = (filling: Record<string, any>) =>
    filling && Number(filling.type) === 2 && filling.gradient?.stops?.length ? getGradientOrImg({ filling }) : filling?.color

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
                style={effectStyle(ef, 1 / coefficient)}
                className="demo"
              >
                A
              </div>
            ))}
            A
          </div>
          <Popover
            placement="left"
            popperClass="ds-effect-picker"
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
                          className="feature__toggle"
                          onChange={(next) => patchLayer(index, { filling: { ...element.filling, enable: next } })}
                        />
                        <ColorSelect
                          value={fillValue(element.filling)}
                          width="32px"
                          className="feature__swatch"
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
                          className="feature__toggle"
                          onChange={(next) => patchLayer(index, { stroke: { ...element.stroke, enable: next } })}
                        />
                        <ColorSelect
                          value={element.stroke.color}
                          width="32px"
                          className="feature__swatch"
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
                          className="feature__toggle"
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
                  {element.skew ? (
                    <div className={cx('feature', { 'feature--off': !element.skew.enable })}>
                      <div className="feature__row">
                        <Checkbox
                          value={!!element.skew.enable}
                          label="Skew"
                          className="feature__toggle"
                          onChange={(next) => patchLayer(index, { skew: { ...element.skew, enable: next } })}
                        />
                      </div>
                      <div className="feature__fields">
                        <label className="field">
                          <span className="field__label">X</span>
                          <NumberInput
                            value={element.skew.x}
                            minValue={-89}
                            maxValue={89}
                            type="simple"
                            onChange={(next) => patchLayer(index, { skew: { ...element.skew, x: Number(next) } })}
                          />
                        </label>
                        <label className="field">
                          <span className="field__label">Y</span>
                          <NumberInput
                            value={element.skew.y}
                            minValue={-89}
                            maxValue={89}
                            type="simple"
                            onChange={(next) => patchLayer(index, { skew: { ...element.skew, y: Number(next) } })}
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
                          className="feature__toggle"
                          onChange={(next) => patchLayer(index, { shadow: { ...element.shadow, enable: next } })}
                        />
                        <ColorSelect
                          value={element.shadow.color}
                          width="32px"
                          className="feature__swatch"
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
