/*
 * The brand kit against the page on screen: one colour onto the selection, a
 * `{{school.*}}` field or the school's crest dropped onto the canvas, and Apply
 * brand over the whole design.
 *
 * The arithmetic — which colour goes where, which font a line asks for, what
 * has to move to stay readable — is in `brandCore.ts`, which knows nothing of
 * the store and is what the compose entry calls on a server. This file is the
 * part that reads `widgetState`, and it re-exports the core whole so nothing
 * that already imported one of those names has to change.
 *
 * None of these record history themselves — the caller decides how much one
 * undo takes back, and wraps the call in `recordHistory`.
 */
import type { TBrandKit } from '@/common/methods/brandKit'
import { brandResolver } from '@/common/methods/brandKit'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import recolorEffects from '@/components/modules/widgets/wText/recolorEffects'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import { updatePageData } from '../canvas'
import { canvasState, widgetState } from '../state'
import type { TdWidgetData } from '../types'
import { addWidget } from './widget'
import { applyBrandToLayouts, type TApplyBrandOptions, type TApplyBrandOutcome } from './brandCore'

export * from './brandCore'

/** The drawn shapes, which all keep their fill in `color`. */
const SHAPE_TYPES = new Set(['w-rect', 'w-ellipse', 'w-polygon', 'w-path'])

function carriesText(widget: TdWidgetData): widget is TdWidgetData & { text: string } {
  return widget.type === 'w-text' && typeof widget.text === 'string'
}

// ---- one colour onto the selection ------------------------------------------

/**
 * Paints whatever is selected in one brand colour: the words of a text box,
 * the fill of a shape, the first colour of a piece of line art, or the page
 * itself when nothing is selected. A group takes it on every member; a
 * marquee selection takes it on each thing in it. Returns how many things
 * changed, so the caller can say when the answer is none — a photograph,
 * say, which has no colour of its own to change.
 */
export function applyBrandColorToSelection(color: string): number {
  // Nothing has been clicked yet on a design just opened, so dActiveElement is
  // still null rather than the page. That is the same "nothing is selected" the
  // page stands for everywhere else, so treat it as the page.
  const active = widgetState.dActiveElement ?? canvasState.dPage
  const selected = widgetState.dSelectWidgets
  const targets: TdWidgetData[] = selected.length ? selected.slice() : [active]
  if (targets.length === 0) return 0

  let changed = 0
  for (const target of targets) {
    if (target.uuid === '-1') {
      updatePageData({ key: 'backgroundColor', value: color })
      updatePageData({ key: 'backgroundGradient', value: '' })
      changed++
      continue
    }
    const members = target.isContainer ? widgetState.dWidgets.filter((item) => item.parent === target.uuid) : [target]
    for (const member of members) {
      // The selection holds snapshots of the widgets as often as the widgets
      // themselves; paint the one the store holds.
      const widget = widgetState.dWidgets.find((item) => item.uuid === member.uuid)
      if (widget && paintWidget(widget, color)) changed++
    }
  }
  return changed
}

function paintWidget(widget: TdWidgetData, color: string): boolean {
  if (widget.type === 'w-text') {
    const effects = (widget as any).textEffects
    if (effects?.length) {
      ;(widget as any).textEffects = recolorEffects(JSON.parse(JSON.stringify(effects)), (widget as any).color, color)
    }
    ;(widget as any).color = color
    return true
  }
  if (SHAPE_TYPES.has(widget.type)) {
    ;(widget as any).color = color
    return true
  }
  if (widget.type === 'w-svg') {
    const colors: string[] = Array.isArray((widget as any).colors) ? (widget as any).colors.slice() : []
    colors[0] = color
    ;(widget as any).colors = colors
    return true
  }
  return false
}

// ---- a field or the logo onto the page ---------------------------------------

/**
 * Puts a `{{school.*}}` field where it will be read: on the end of the text
 * box that is selected, or into a new text box in the middle of the page when
 * none is. Says which it did.
 */
export function insertBrandField(field: string): 'appended' | 'added' {
  const token = `{{${field}}}`
  const active = widgetState.dActiveElement
  const widget = active && active.uuid !== '-1' ? widgetState.dWidgets.find((item) => item.uuid === active.uuid) : undefined
  if (widget && carriesText(widget) && !widget.hidden) {
    const text = widget.text
    const needsSpace = text.length > 0 && !/(\s|&nbsp;|>)$/.test(text)
    widget.text = text + (needsSpace ? ' ' : '') + token
    return 'appended'
  }

  const setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = token
  setting.fontSize = 32
  const { width: pW, height: pH } = canvasState.dPage
  setting.width = Math.round(Math.min(setting.fontSize * 0.55 * token.length, pW * 0.8))
  setting.left = Math.round((pW - setting.width) / 2)
  setting.top = Math.round((pH - setting.fontSize * setting.lineHeight) / 2)
  addWidget(setting)
  return 'added'
}

/**
 * Puts the logo on the page as a picture, a fifth of the page wide — big
 * enough to read on a poster, small enough to sit in a corner of a slide —
 * and no bigger than the file itself, so a small crest is not blown up soft.
 */
export function insertBrandLogo(logo: NonNullable<TBrandKit['logo']>) {
  const { width: pW, height: pH } = canvasState.dPage
  const ratio = logo.width && logo.height ? logo.width / logo.height : 1
  let width = Math.round(pW * 0.2)
  let height = Math.round(width / ratio)
  if (height > pH * 0.2) {
    height = Math.round(pH * 0.2)
    width = Math.round(height * ratio)
  }
  if (logo.width && width > logo.width) {
    width = logo.width
    height = logo.height
  }
  const setting = JSON.parse(JSON.stringify(wImageSetting))
  setting.imgUrl = logo.url
  setting.width = width
  setting.height = height
  setting.left = Math.round((pW - width) / 2)
  setting.top = Math.round((pH - height) / 2)
  addWidget(setting)
}

/**
 * Apply brand, over the design the editor has open.
 *
 * The work is `applyBrandToLayouts`; what this adds is the one thing the core
 * cannot know, which design that is. It writes through the store's own arrays,
 * so the page on screen moves with the rest.
 */
export function applyBrandToDesign(kit: TBrandKit, options: TApplyBrandOptions): TApplyBrandOutcome {
  return applyBrandToLayouts(widgetState.dLayouts, kit, options)
}
