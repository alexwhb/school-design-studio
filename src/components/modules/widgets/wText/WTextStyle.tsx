import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { styleIconList1, styleIconList2 } from '@/assets/data/TextIconsData'
import { FONT_GROUPS, type TFontItem } from '@/assets/data/FontsData'
import { brandFontItems, brandState } from '@/common/methods/brandKit'
import { useFontStore } from '@/common/methods/fonts'
import { PanelSection } from '@/components/ui/PanelSection'
import { LetterSpacingIcon, LineHeightIcon } from '@/components/ui/icons'
import { controlState, widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { setWidgetStyle, updateWidgetData } from '@/store/widget'
import NumberInput from '../../settings/NumberInput'
import NumberSlider from '../../settings/NumberSlider'
import ColorSelect from '../../settings/ColorSelect'
import ArrangeRow from '../../settings/ArrangeRow'
import IconItemSelect, { type TIconItemSelectData } from '../../settings/IconItemSelect'
import OpacityRow from '../../settings/OpacityRow'
import TextInputArea from '../../settings/TextInputArea'
import ToggleRow from '../../settings/ToggleRow'
import TransformGrid from '../../settings/TransformGrid'
import ValueSelect from '../../settings/ValueSelect'
import TextWrap from '../../settings/EffectSelect/TextWrap'
import recolorEffects, { parseColor, replaceEffectColor, type TColorParts } from './recolorEffects'
import effectColors, { type TEffectColor } from './effectColors'
import { applyListStyle, textToLines, type TListStyle } from './listMarkup'
import { retypeText } from '@/utils/widgets/richText'
import { colourInline, hasInlineSelection, inlineState, toggleInline, type TInlineKind } from './inlineFormat'
import './wTextStyle.less'

/** The panel's whole-box properties that also exist as formatting on a selection. */
const INLINE_KINDS: Record<string, TInlineKind> = { fontWeight: 'bold', fontStyle: 'italic', underline: 'underline', 'line-through': 'strike' }

const FONT_SIZE_LIST = [12, 14, 24, 26, 28, 30, 36, 48, 60, 72, 96, 108, 120, 140, 180, 200, 250, 300, 400, 500]

function buildFontLists(brand: TFontItem[] = []) {
  const localFonts = useFontStore.list
  const fontLists: Record<string, any> = {}
  // The school's own fonts first, so they are one click away. The same
  // families still sit in their own groups below.
  if (brand.length) fontLists.Brand = brand.map(({ id, oid, value, url, alias, preview }) => ({ id, oid, value, url, alias, preview }))
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
  const inline = useSnapshot(inlineState)
  /** The caret is in this box: the style buttons may be about a selection. */
  const editing = !!active && inline.uuid === String(active.uuid)
  const onSelection = editing && inline.selected
  const [fontClassList, setFontClassList] = useState<Record<string, any>>({})

  const brandFonts = useSnapshot(brandState).kit.fonts
  useEffect(() => {
    const timer = setTimeout(() => setFontClassList(buildFontLists(brandFontItems(brandFonts))), 100)
    return () => clearTimeout(timer)
  }, [brandFonts.heading, brandFonts.body])

  const styleIcons1 = useMemo(() => {
    if (!active) return styleIconList1
    return styleIconList1.map((item) => {
      const next = { ...item, select: false }
      const [unchecked, checked] = item.value
      const kind = inlineKindOf(item)
      // With a run of text selected the button says what that run is, since
      // that is what pressing it will change.
      if (onSelection && kind) {
        next.select = inline[kind]
        return next
      }
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
  }, [active?.fontWeight, active?.textDecoration, active?.fontStyle, active?.writingMode, active, onSelection, inline.bold, inline.italic, inline.underline, inline.strike])

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
    // A selection takes the colour itself, and the box keeps its own.
    if (hasInlineSelection(uuid) && colourInline(value)) return
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
    // Bold with a word selected is bold on the word — see inlineFormat.ts. The
    // toggle falls through to the whole box only if the selection has gone.
    const kind = inlineKindOf(item)
    if (kind && hasInlineSelection(uuid) && toggleInline(kind)) return
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

  /**
   * While the caret is in the box, a press on one of the panel's buttons must
   * not take focus, and the selection with it, out of the text. Fields still
   * take it — a size has to be typed into — and so do the pickers, which are
   * drawn elsewhere in the document and only pass through here in React's
   * tree; the check is on where the press landed.
   */
  function keepCaret(e: React.MouseEvent<HTMLDivElement>) {
    if (!editing) return
    const target = e.target as HTMLElement
    if (!e.currentTarget.contains(target) || target.closest('input, textarea, select, [contenteditable]')) return
    e.preventDefault()
  }

  return (
    <div id="w-text-style" onMouseDown={keepCaret}>
      <PanelSection title="Transform">
        <TransformGrid active={active} rotation onChange={(key, value) => finish(key, value)} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" />
      </PanelSection>

      <PanelSection title="Text">
        <div className="text-fields">
          <ValueSelect className="font-select is-tall" value={active.fontClass} data={fontClassList} inputWidth="100%" readonly onFinish={(font) => finish('fontClass', font as any)} />
          <div className="text-row">
            <ValueSelect className="size-select" variant="underline" value={active.fontSize} suffix="px" data={FONT_SIZE_LIST} inputWidth="56px" onFinish={(value) => finish('fontSize', Math.max(1, Math.min(500, Number(value) || 1)))} />
            <IconItemSelect className="text-style-icons" data={styleIcons1} onFinish={textStyleAction} />
          </div>
          <div className="text-row">
            <span className="text-row__icon" aria-hidden="true">
              <LetterSpacingIcon />
            </span>
            <NumberInput variant="underline" value={active.letterSpacing} onChange={(value) => finish('letterSpacing', Number(value))} />
            <span className="text-row__icon" aria-hidden="true">
              <LineHeightIcon />
            </span>
            <NumberInput variant="underline" value={active.lineHeight} onChange={(value) => finish('lineHeight', Number(value))} />
          </div>
          <IconItemSelect data={styleIcons2} onFinish={textStyleAction} />
          {editing ? <p className="inline-scope">{onSelection ? 'Bold, italic, underline, strikethrough and colour apply to the selected text.' : 'Select some of the text to style just that part; otherwise the whole box changes.'}</p> : null}
          {/* Retyped rather than replaced, so a corrected word does not cost the
              line its bold — see retypeText. */}
          <TextInputArea value={textToLines(active.text).join('\n')} onChange={(value) => finish('text', retypeText(active.text, value, listStyle))} />
        </div>
      </PanelSection>

      <PanelSection title="Appearance">
        <div className="slide-wrap">
          <OpacityRow value={active.opacity ?? 1} onChange={(value) => finish('opacity', value)} />
          <ColorSelect className="text-colour" variant="row" label="Fill" value={onSelection && inline.color ? inline.color : active.color} keepOpenOnFocusOutside onValueChange={changeColor} />
          {swatches.length ? (
            <div className="effect-palette">
              <p className="input-label">Effect colours</p>
              <div className="effect-palette__row">
                {swatches.map((colour, index) => (
                  <EffectSwatch key={index} colour={colour} onOpenChange={(open) => setHeld(open ? palette : null)} onChange={changeEffectColor} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </PanelSection>

      <PanelSection title="Effects">
        <TextWrap value={active.textEffects} data={active} degree={active.degree} onValueChange={(value) => finish('textEffects', value as any)} onSelect={selectTextEffect} />
        {/* How far the line sweeps, in degrees: half a turn each way is as far
            as a badge or a crest ever goes, and past it the text meets itself. */}
        <ToggleRow
          className="curve-row"
          label="Curve text"
          checked={Boolean(active.curve)}
          checker
          onCheckedChange={(on) => finish('curve', on ? 30 : 0)}
        >
          <NumberSlider value={active.curve || 0} label="Curve" step={1} minValue={-180} maxValue={180} onChange={(value) => finish('curve', value)} />
        </ToggleRow>
      </PanelSection>
    </div>
  )
}

/** Which selection formatting a panel button stands for, if any. */
function inlineKindOf(item: TIconItemSelectData): TInlineKind | undefined {
  if (item.key === 'textDecoration') return INLINE_KINDS[String((item.value as string[])[1])]
  return item.key ? INLINE_KINDS[item.key] : undefined
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
