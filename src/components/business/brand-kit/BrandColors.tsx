import { useMemo, useState } from 'react'
import { useSnapshot } from 'valtio'
import { recordHistory } from '@/common/hooks/history'
import { MAX_BRAND_COLORS, brandColorRole, brandColorTone, brandState, normaliseBrandColor, updateBrandKit } from '@/common/methods/brandKit'
import { INK, PAPER, composite, contrastRatio, readableOn } from '@/common/methods/contrast'
import Button from '@/components/ui/Button'
import { PencilIcon, PlusIcon } from '@/components/ui/icons'
import Input from '@/components/ui/Input'
import message from '@/components/ui/message'
import ColorPicker from '@/packages/color-picker/ColorPicker'
import { setShowMoveable } from '@/store/control'
import { widgetState } from '@/store/state'
import { applyBrandColorToSelection, countColorUsage, rankDesignColors } from '@/store/widget/brand'
import { cx } from '@/utils/dom'
import './brandColors.less'

/** What a fresh swatch starts on: the navy the bundled templates are set in. */
const FIRST_COLOR = '#1e3a5fff'

/** How many colours the strip above the picker offers. */
const DRAFT_SWATCHES = 6

/** `#rrggbb`, or the full eight digits when the colour is not opaque. */
function shortHex(color: string): string {
  const value = color.length === 9 && color.endsWith('ff') ? color.slice(0, 7) : color
  return value.toUpperCase()
}

function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`
}

/** What text needs against paper to be read at an ordinary size. WCAG 2.x. */
const TEXT_TARGET = 4.5

/**
 * The two things worth knowing about a colour before it goes in the kit: can
 * it be *set in* — a heading on white paper — and what can be set *on* it when
 * it is a band or a badge. Neither is a rule about the kit; a school's colour
 * is its colour. It is what the editor will have to do when the colour lands
 * on a poster, said before it does it rather than discovered afterwards.
 */
function readability(color: string) {
  const flat = composite(color, PAPER)
  const asText = contrastRatio(flat, PAPER)
  const on = readableOn(flat, [PAPER, INK])
  return { flat, asText, on, onRatio: contrastRatio(on, flat), onIsPaper: on === PAPER }
}

/** A ratio as it is written: one decimal, then the colon and the one. */
function asRatio(value: number): string {
  return `${Math.round(value * 10) / 10}:1`
}

/**
 * The colours worth offering as a starting point: the kit's own first, then
 * the ones this design already reaches for most, so a kit is usually built by
 * naming colours that are on the page rather than by hunting for them again.
 */
function draftSwatches(colors: readonly string[]): string[] {
  const picks: string[] = []
  for (const color of colors) if (!picks.includes(color)) picks.push(color)
  for (const rgb of rankDesignColors(widgetState.dLayouts)) {
    if (picks.length >= DRAFT_SWATCHES) break
    const color = `#${rgb}ff`
    if (!picks.includes(color)) picks.push(color)
  }
  return picks.slice(0, DRAFT_SWATCHES)
}

/** Which row the editing card has taken over: an index, or the new colour. */
type TEditing = number | 'new' | null

/**
 * The school's colours: one row each, and the card that edits one in place.
 *
 * A row is a button that paints whatever is selected, because that is what a
 * colour in a kit is mostly for. Editing is the deliberate act, behind the
 * pencil, and it happens where the row was rather than in a popover — the
 * strip of nearby colours and the "used on N layers" line are the reason to
 * change a colour at all, and neither survives being read through a hole.
 */
export default function BrandColors() {
  const { kit } = useSnapshot(brandState)
  const [editing, setEditing] = useState<TEditing>(null)
  const [draft, setDraft] = useState(FIRST_COLOR)
  const [hexText, setHexText] = useState(shortHex(FIRST_COLOR))
  const [picks, setPicks] = useState<string[]>([])

  // What the colour being edited is painted on today — read once as the card
  // opens, because it describes the colour that is stored, not the draft.
  const usage = useMemo(() => {
    if (typeof editing !== 'number') return null
    return countColorUsage(widgetState.dLayouts, brandState.kit.colors[editing] || '')
  }, [editing])

  function openEditor(which: Exclude<TEditing, null>) {
    const start = typeof which === 'number' ? brandState.kit.colors[which] : FIRST_COLOR
    setPicks(draftSwatches(brandState.kit.colors))
    setDraft(start)
    setHexText(shortHex(start))
    setEditing(which)
    // The picker's drags would otherwise fight the selection box, the same way
    // they would from a swatch in the settings panel.
    setShowMoveable(false)
  }

  function closeEditor() {
    setEditing(null)
    setShowMoveable(true)
  }

  function pickDraft(color: string) {
    setDraft(color)
    setHexText(shortHex(color))
  }

  function typeHex(value: string) {
    setHexText(value)
    const color = normaliseBrandColor(value)
    if (color) setDraft(color)
  }

  function saveColor() {
    const color = normaliseBrandColor(draft)
    if (!color) {
      message({ message: 'That is not a colour the editor can paint with.', type: 'info' })
      return
    }
    const at = typeof editing === 'number' ? editing : -1
    if (brandState.kit.colors.some((existing, index) => existing === color && index !== at)) {
      message({ message: 'That colour is already in the kit.', type: 'info' })
      return
    }
    updateBrandKit((next) => {
      if (at >= 0) next.colors[at] = color
      else next.colors.push(color)
    })
    closeEditor()
  }

  function removeColor() {
    if (typeof editing !== 'number') return
    const at = editing
    updateBrandKit((next) => {
      next.colors.splice(at, 1)
    })
    closeEditor()
  }

  function applyColor(color: string) {
    let changed = 0
    recordHistory(() => {
      changed = applyBrandColorToSelection(color)
    })
    if (!changed) message({ message: 'Select some text, a shape or nothing at all — the page — to colour it.', type: 'info' })
  }

  function usageNote(): string {
    if (!usage || !usage.pages) return 'Not used in this design yet.'
    if (!usage.layers) return `Used as the background on ${plural(usage.pages, 'page', 'pages')}.`
    return `Used on ${plural(usage.layers, 'layer', 'layers')} across ${plural(usage.pages, 'page', 'pages')}.`
  }

  /**
   * What this colour will be like to read, said while it is still a draft. The
   * failing case names the consequence rather than the rule, because "3.1:1"
   * on its own is a number nobody in a school office has a target for.
   */
  function readsNote(): string {
    const reads = readability(draft)
    if (reads.asText < TEXT_TARGET) {
      return `Reads on white at ${asRatio(reads.asText)} — lighter text will be darkened on posters.`
    }
    return `Reads on white at ${asRatio(reads.asText)}. ${reads.onIsPaper ? 'White' : 'Ink'} reads on it at ${asRatio(reads.onRatio)}.`
  }

  const editor = (
    <div className="brand-editor" key="brand-editor">
      <div className="brand-editor__top">
        <span className="brand-editor__chip" style={{ background: draft }} />
        <Input wrapperClassName="brand-editor__hex" variant="underline" value={hexText} spellCheck={false} aria-label="Colour hex" onChange={typeHex} />
      </div>
      <div className="brand-editor__strip">
        {picks.map((color) => (
          <button key={color} type="button" className={cx('brand-editor__pick', { 'is-on': color === draft })} style={{ background: color }} title={shortHex(color)} aria-label={shortHex(color)} aria-pressed={color === draft} onClick={() => pickDraft(color)} />
        ))}
      </div>
      <ColorPicker value={draft} modes={['Solid']} onValueChange={setDraft} />
      <p className="brand-editor__note">{usageNote()}</p>
      <p className="brand-editor__reads">{readsNote()}</p>
      <div className="brand-editor__actions">
        <Button type="primary" size="small" className="brand-editor__save" onClick={saveColor}>
          Save to kit
        </Button>
        <Button size="small" className="brand-editor__cancel" onClick={closeEditor}>
          Cancel
        </Button>
      </div>
      {typeof editing === 'number' ? (
        <button type="button" className="brand-editor__remove" onClick={removeColor}>
          Remove from kit
        </button>
      ) : null}
    </div>
  )

  return (
    <div className="brand-colours" role="list" aria-label="Brand colours">
      {kit.colors.map((color, index) => {
        if (editing === index) return editor
        const hex = shortHex(color)
        const tone = brandColorTone(color)
        const reads = readability(color)
        return (
          <div key={`${color}-${index}`} className="brand-swatch" role="listitem">
            <button type="button" className="brand-swatch__row" title={hex} aria-label={`Apply ${hex}`} onClick={() => applyColor(color)}>
              <span className="brand-swatch__chip" style={{ background: color }} />
              <span className="brand-swatch__role">
                {brandColorRole(index)}
                {tone ? <span className="brand-swatch__tone"> · {tone}</span> : null}
              </span>
              {/* Two samples rather than two ticks: the pale colour that
                  cannot be read on paper is shown being unreadable on paper,
                  which needs no legend. */}
              <span className="brand-swatch__reads" title={`As text on white: ${asRatio(reads.asText)}. As a surface: ${reads.onIsPaper ? 'white' : 'ink'} reads on it at ${asRatio(reads.onRatio)}.`}>
                <span className="brand-swatch__mark" style={{ background: PAPER, color: reads.flat }}>
                  Aa
                </span>
                <span className="brand-swatch__mark" style={{ background: reads.flat, color: reads.on }}>
                  Aa
                </span>
              </span>
              <span className="brand-swatch__hex">{hex}</span>
            </button>
            <button type="button" className="brand-swatch__edit" title="Edit this colour" aria-label={`Edit ${hex}`} onClick={() => openEditor(index)}>
              <PencilIcon />
            </button>
          </div>
        )
      })}
      {editing === 'new' ? editor : null}
      {editing !== 'new' && kit.colors.length < MAX_BRAND_COLORS ? (
        <button type="button" className="brand-swatch--add" onClick={() => openEditor('new')}>
          <PlusIcon />
          Add a colour
        </button>
      ) : null}
    </div>
  )
}
