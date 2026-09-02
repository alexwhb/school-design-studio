import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { alignIconList, styleIconList1, styleIconList2 } from '@/assets/data/TextIconsData'
import layerIconList from '@/assets/data/LayerIconList'
import { FONT_GROUPS } from '@/assets/data/FontsData'
import { useFontStore } from '@/common/methods/fonts'
import PanelSections, { PanelSection } from '@/components/ui/PanelSection'
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
import recolorEffects, { parseColor, replaceEffectColor, type TColorParts } from './recolorEffects'
import effectColors, { type TEffectColor } from './effectColors'
import { applyListStyle, textToLines, type TListStyle } from './listMarkup'
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
      select: ['textAlign', 'textAlignLast', 'listStyle'].includes(item.key) && active[item.key] === item.value,
      // An arc is laid out character by character, so there is nowhere on it
      // for a marker to sit. See arcLayout.ts.
      disabled: item.key === 'listStyle' && Boolean(active.curve),
    }))
  }, [active?.textAlign, active?.textAlignLast, active?.listStyle, active?.curve, active])

  /**
   * The colours the stack paints that the Colour swatch does not already
   * carry. See effectColors.ts — without these a two-tone preset has one
   * control for two colours, and a patterned one has none at all.
   */
  const palette = useMemo(() => effectColors(active?.textEffects, active?.color), [active?.textEffects, active?.color])

  /**
   * The palette stands still while one of its pickers is open.
   *
   * It is read back out of the stack, and the picker rewrites the stack on
   * every drag — so the entry a swatch stands for is renamed under it as soon
   * as the drag starts, which remounts the swatch and takes the picker with
   * it. Dragging one colour onto another, or onto the text's own, drops an
   * entry and does the same. So the list is held as it was when the picker
   * opened, and read afresh once it closes.
   */
  const [held, setHeld] = useState<TEffectColor[] | null>(null)
  const swatches = held || palette
  // A held list belongs to the widget it was read from, so selecting another
  // one drops it rather than leaving that widget's colours on show.
  useEffect(() => setHeld(null), [active?.uuid])

  if (!active) return null

  const uuid = active.uuid as string
  const listStyle = (active.listStyle ?? 'none') as TListStyle

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

  /**
   * One colour out of the stack, changed wherever the stack paints it. This is
   * the same move changeColor makes, aimed at a colour the preset brought with
   * it rather than at the text's own.
   */
  function changeEffectColor(from: TColorParts, value: string): TColorParts | null {
    const target = widgetState.dActiveElement as any
    const effects = target?.textEffects
    const now = parseColor(value)
    // As above: the panel can still be holding the widget selected a moment ago.
    if (!now || !effects?.length || target.uuid !== uuid) return null
    finish('textEffects', replaceEffectColor(JSON.parse(JSON.stringify(effects)), from, now) as any)
    // What the stack now paints, for the swatch to aim its next change at.
    return now
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

  /**
   * A list is markup, not a CSS property, so the toggle rewrites the widget's
   * text alongside its listStyle — see listMarkup.ts for why the markers live
   * in the text itself. Pressing the style that is already on turns it off.
   */
  function changeListStyle(value: TListStyle) {
    const target = widgetState.dActiveElement as any
    // The panel can still be holding the widget that was selected a moment ago.
    if (!target || target.uuid !== uuid) return
    const next = (target.listStyle ?? 'none') === value ? 'none' : value
    finish('text', applyListStyle(target.text, next))
    finish('listStyle', next)
    requestAnimationFrame(() => setUpdateRect())
  }

  function textStyleAction(item: TIconItemSelectData) {
    const target = widgetState.dActiveElement as any
    if (!target) return
    if (item.key === 'listStyle') return changeListStyle(item.value as TListStyle)
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
      <PanelSections value={activeNames} onChange={setActiveNames}>
        <PanelSection name="1" title="Size and position">
          <div className="line-layout">
            <NumberInput value={active.left} label="X" onChange={(v) => finish('left', Number(v))} />
            <NumberInput value={active.top} label="Y" onChange={(v) => finish('top', Number(v))} />
            <NumberInput value={active.width} label="W" editable onChange={(v) => finish('width', Number(v))} />
            <NumberInput value={active.height} label="H" editable onChange={(v) => finish('height', Number(v))} />
          </div>
        </PanelSection>
      </PanelSections>

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
        {/* How far the line sweeps, in degrees: half a turn each way is as far
            as a badge or a crest ever goes, and past it the text meets itself. */}
        <NumberSlider
          value={active.curve || 0}
          style={{ fontSize: 14 }}
          label="Curve"
          step={1}
          minValue={-180}
          maxValue={180}
          onChange={(value) => finish('curve', value)}
        />
      </div>

      <div style={{ flexWrap: 'nowrap' }} className="line-layout style-item text-colour">
        <ColorSelect value={active.color} label="Colour" onValueChange={changeColor} />
      </div>
      {swatches.length ? (
        <div className="style-item effect-palette">
          <p className="input-label">Effect colours</p>
          <div className="effect-palette__row">
            {swatches.map((colour, index) => (
              <EffectSwatch
                key={index}
                colour={colour}
                onOpenChange={(open) => setHeld(open ? palette : null)}
                onChange={changeEffectColor}
              />
            ))}
          </div>
        </div>
      ) : null}
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
        <TextInputArea value={textToLines(active.text).join('\n')} onChange={(value) => finish('text', applyListStyle(value, listStyle))} />
      </div>
    </div>
  )
}

/**
 * One colour out of the effect stack.
 *
 * The picker sends a colour on every drag and each one is written straight
 * through, so after the first the swatch no longer stands for the colour it
 * opened on. It remembers what it last painted and aims the next change there
 * — otherwise a drag would move the artwork once and then paint nothing.
 */
function EffectSwatch({
  colour,
  onOpenChange,
  onChange,
}: {
  colour: TEffectColor
  onOpenChange: (open: boolean) => void
  onChange: (from: TColorParts, value: string) => TColorParts | null
}) {
  const painted = useRef<TColorParts>(colour)
  useEffect(() => {
    painted.current = colour
  }, [colour])

  return (
    <ColorSelect
      value={colour.value}
      width="32px"
      className="effect-palette__swatch"
      onOpenChange={onOpenChange}
      onValueChange={(next) => {
        const now = onChange(painted.current, next)
        if (now) painted.current = now
      }}
    />
  )
}
