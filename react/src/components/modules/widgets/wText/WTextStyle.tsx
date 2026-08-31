import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { alignIconList, styleIconList1, styleIconList2 } from '@/assets/data/TextIconsData'
import layerIconList from '@/assets/data/LayerIconList'
import { FONT_GROUPS } from '@/assets/data/FontsData'
import { useFontStore } from '@/common/methods/fonts'
import Collapse, { CollapseItem } from '@/components/ui/Collapse'
import { controlState, widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { setWidgetStyle, updateAlign, updateLayerIndex, updateWidgetData } from '@/store/widget'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import ColorSelect from '../../settings/ColorSelect'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import TextInputArea from '../../settings/TextInputArea'
import ValueSelect from '../../settings/ValueSelect'
import TextWrap from '../../settings/EffectSelect/TextWrap'
import recolorEffects from './recolorEffects'
import './wTextStyle.less'

const FONT_SIZE_LIST = [12, 14, 24, 26, 28, 30, 36, 48, 60, 72, 96, 108, 120, 140, 180, 200, 250, 300, 400, 500]

function buildFontLists() {
  const localFonts = useFontStore.list
  const fontLists: Record<string, any> = {}
  for (const group of Object.values(FONT_GROUPS)) fontLists[group] = []
  for (const font of localFonts) {
    const { id, oid, value, url, alias, preview, kind } = font
    fontLists[FONT_GROUPS[kind]].push({ id, oid, value, url, alias, preview })
  }
  return fontLists
}

export default function WTextStyle() {
  const snap = useSnapshot(widgetState)
  const active = snap.dActiveElement as any
  const [activeNames, setActiveNames] = useState<string[]>([])
  const [fontClassList, setFontClassList] = useState<Record<string, any>>({})

  useEffect(() => {
    const timer = setTimeout(() => setFontClassList(buildFontLists()), 100)
    return () => clearTimeout(timer)
  }, [])

  const styleIcons1 = useMemo(() => {
    if (!active) return styleIconList1
    return styleIconList1.map((item) => {
      const next = { ...item, select: false }
      const [unchecked, checked] = item.value
      switch (item.key) {
        case 'fontWeight':
        case 'textDecoration':
        case 'fontStyle':
          if (active[item.key] !== unchecked && active[item.key] == checked) next.select = true
          break
        case 'writingMode':
          if (active[item.key] !== unchecked) next.select = true
          break
      }
      return next
    })
  }, [active?.fontWeight, active?.textDecoration, active?.fontStyle, active?.writingMode, active])

  const styleIcons2 = useMemo(() => {
    if (!active) return styleIconList2
    return styleIconList2.map((item) => ({
      ...item,
      select: ['textAlign', 'textAlignLast'].includes(item.key) && active[item.key] === item.value,
    }))
  }, [active?.textAlign, active?.textAlignLast, active])

  if (!active) return null

  const uuid = active.uuid as string

  function finish(key: string, value: number | Record<string, any> | string) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  /**
   * A text effect is painted in the text's own colour, so the colour swatch has
   * to carry the stack with it — the fill layer sits on top of the plain text
   * and would otherwise go on showing the old colour, which reads as the swatch
   * doing nothing at all. See recolorEffects.ts for which parts follow.
   *
   * The widget still holds the colour being replaced, which is why the stack is
   * rewritten before the new colour is written through.
   */
  function changeColor(value: string) {
    const target = widgetState.dActiveElement as any
    const effects = target?.textEffects
    // The panel can still be holding the widget that was selected a moment ago.
    // Recolouring then would write one widget's stack onto another.
    if (effects?.length && target.uuid === uuid) {
      finish('textEffects', recolorEffects(JSON.parse(JSON.stringify(effects)), target.color, value) as any)
    }
    finish('color', value)
  }

  function selectTextEffect({ key, value, style }: any) {
    setWidgetStyle({ uuid, key, value })
    if (style) {
      finish('color', style.color || '')
    }
  }

  function layerAction(item: TIconItemSelectData) {
    updateLayerIndex({ uuid, value: Number(item.value) })
  }

  function textStyleAction(item: TIconItemSelectData) {
    const target = widgetState.dActiveElement as any
    if (!target) return
    let value: any = ['textAlign', 'textAlignLast'].includes(item.key || '')
      ? item.value
      : (item.value as any[])[item.select ? 1 : 0]
    if (item.key === 'textAlignLast' && target[item.key] === value) value = undefined
    item.key && (target[item.key] = value)
    if (item.key === 'writingMode') relationChange()
    requestAnimationFrame(() => setUpdateRect())
  }

  function relationChange() {
    setTimeout(() => {
      const target = widgetState.dActiveElement as any
      if (target && target.writingMode) {
        const wRecord = target.width
        target.width = target.height
        target.height = wRecord
      }
    }, 10)
  }

  function alignAction(item: TIconItemSelectData) {
    updateAlign({ align: item.value as any, uuid })
    requestAnimationFrame(() => setUpdateRect())
  }

  return (
    <div id="w-text-style">
      <Collapse value={activeNames} onChange={setActiveNames}>
        <CollapseItem name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" editable onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" editable onChange={(v) => finish('height', Number(v))} />
          </div>
        </CollapseItem>
      </Collapse>

      <div className="line-layout style-item">
        <ValueSelect
          value={active.fontClass}
          label="Text"
          data={fontClassList}
          inputWidth="152px"
          readonly
          onFinish={(font) => finish('fontClass', font as any)}
        />
        <ValueSelect
          value={active.fontSize}
          label="Size"
          suffix="px"
          data={FONT_SIZE_LIST}
          onFinish={(value) => finish('fontSize', Number(value))}
        />
      </div>

      <IconItemSelect className="style-item" data={styleIcons1} onFinish={textStyleAction} />
      <IconItemSelect className="style-item" data={styleIcons2} onFinish={textStyleAction} />

      <div className="style-item slide-wrap">
        <NumberSlider
          value={active.letterSpacing}
          style={{ fontSize: 14 }}
          label="Letter spacing"
          step={0.05}
          minValue={-active.fontSize}
          maxValue={active.fontSize * 2}
          onChange={(value) => finish('letterSpacing', value)}
        />
        <NumberSlider
          value={active.lineHeight}
          style={{ fontSize: 14 }}
          label="Line height"
          step={0.05}
          minValue={0}
          maxValue={2.5}
          onChange={(value) => finish('lineHeight', value)}
        />
      </div>

      <div style={{ flexWrap: 'nowrap' }} className="line-layout style-item">
        <ColorSelect value={active.color} label="Colour" onValueChange={changeColor} />
      </div>
      <div className="line-layout style-item">
        <TextWrap
          value={active.textEffects}
          data={active}
          degree={active.degree}
          onValueChange={(value) => finish('textEffects', value as any)}
          onSelect={selectTextEffect}
        />
      </div>
      <IconItemSelect className="style-item" data={layerIconList} onFinish={layerAction} />
      <IconItemSelect className="style-item" data={alignIconList} onFinish={alignAction} />

      <div style={{ marginTop: 10 }} className="line-layout style-item">
        <TextInputArea value={active.text} onChange={(value) => finish('text', value)} />
      </div>
    </div>
  )
}
