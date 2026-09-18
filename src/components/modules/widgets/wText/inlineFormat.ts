/**
 * Formatting a selection inside the text box being edited.
 *
 * While a text widget has the caret, the formatting controls — the floating
 * toolbar over the selection, the bold and colour buttons in the settings
 * panel, Ctrl+B — all act through here. The session keeps hold of the last
 * selection made inside the box, because using any of those controls takes
 * focus, and with it the selection, out of the box: a swatch in the panel is a
 * popover with its own inputs, and the link field is a text field. Applying a
 * change puts the selection back first and then lets the browser's own editing
 * commands do the work; what they write is pared back to the allowlist when
 * the edit is stored (see utils/widgets/richText.ts), so the exact markup a
 * command produces — <b> or <strong>, a <span> or a <font> — does not matter.
 *
 * `inlineState` is what the controls read: which box has the caret, whether a
 * run is selected or just a caret placed, and what the selection already is.
 * The panel uses it to decide whether Bold means this word or the whole box.
 */
import { proxy } from 'valtio'
import { normaliseColor, normaliseHref } from '@/utils/widgets/richText'

export type TInlineKind = 'bold' | 'italic' | 'underline' | 'strike'

export type TInlineRect = { left: number; top: number; width: number; height: number }

export const inlineState = proxy({
  /** The widget whose text has the caret, or '' when none has. */
  uuid: '',
  /** Whether a run of text is selected, as opposed to a bare caret. */
  selected: false,
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  /** The selection's own colour, or '' for the box's. */
  color: '',
  /** The link the selection is inside, or ''. */
  href: '',
  /** Where the selection is on screen, for the toolbar to stand over. */
  rect: null as TInlineRect | null,
})

const COMMANDS: Record<TInlineKind, string> = {
  bold: 'bold',
  italic: 'italic',
  underline: 'underline',
  strike: 'strikeThrough',
}

/**
 * The caret's own controls. A press on one of these, or focus moving into one,
 * is the text being formatted, not left — so the edit stays open through it.
 * The last two are where every popover in the app is drawn.
 */
const OWN_CONTROLS = '#w-text-style, .inline-toolbar, .ds-popper, [data-radix-popper-content-wrapper]'

let host: HTMLElement | null = null
let saved: Range | null = null
/** What the pointer last went down on, held until it comes up again. */
let lastPress: EventTarget | null = null
let finish: (() => void) | null = null

const elementOf = (target: EventTarget | Node | null | undefined): Element | null => (target instanceof Element ? target : target instanceof Node ? target.parentElement : null)

/** Whether `target` is one of the caret's own controls. */
export function isOwnControl(target: EventTarget | null | undefined): boolean {
  const el = elementOf(target)
  return !!el && !!el.closest(OWN_CONTROLS)
}

/**
 * Whether a blur is focus going to one of the caret's own controls — by
 * keyboard, in which case the event says where, or by a press, in which case
 * focus goes nowhere in particular and only the press says.
 */
export function blurStaysInSession(relatedTarget: EventTarget | null): boolean {
  return isOwnControl(relatedTarget) || isOwnControl(lastPress)
}

export function startInlineSession(uuid: string, el: HTMLElement, onFinish: () => void): void {
  if (host === el) return
  if (host) endInlineSession(host)
  host = el
  saved = null
  finish = onFinish
  inlineState.uuid = uuid
  document.addEventListener('selectionchange', onSelectionChange)
  document.addEventListener('pointerdown', onPointerDown, true)
  document.addEventListener('pointerup', onPointerUp, true)
  // Bubbling, not capturing: the undo history brackets a change between a
  // press and its release with a listener of its own on the document, and
  // this one is added after it, so the text committed here lands inside the
  // bracket rather than before it opens.
  document.addEventListener('mousedown', onMouseDown)
  window.addEventListener('scroll', refresh, true)
  window.addEventListener('resize', refresh)
  refresh()
}

export function endInlineSession(el: HTMLElement): void {
  if (host !== el) return
  host = null
  saved = null
  finish = null
  lastPress = null
  document.removeEventListener('selectionchange', onSelectionChange)
  document.removeEventListener('pointerdown', onPointerDown, true)
  document.removeEventListener('pointerup', onPointerUp, true)
  document.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('scroll', refresh, true)
  window.removeEventListener('resize', refresh)
  Object.assign(inlineState, { uuid: '', selected: false, bold: false, italic: false, underline: false, strike: false, color: '', href: '', rect: null })
}

/** Whether the widget has the caret and a run of its text is selected. */
export function hasInlineSelection(uuid: string): boolean {
  return inlineState.uuid === String(uuid) && inlineState.selected
}

function onPointerDown(e: PointerEvent) {
  lastPress = e.target
}

function onPointerUp() {
  lastPress = null
}

/**
 * A press anywhere but the text and its controls ends the edit. Ordinarily the
 * blur does that, but focus may already have left the box for one of the
 * controls, in which case there is no blur left to come.
 */
function onMouseDown(e: MouseEvent) {
  if (!host) return
  const target = e.target as Node
  if (host.contains(target) || isOwnControl(target)) return
  finish?.()
}

function onSelectionChange() {
  const selection = document.getSelection()
  if (!host || !selection || selection.rangeCount === 0) return
  const range = selection.getRangeAt(0)
  // A selection made elsewhere — in the link field, say — is not the text's.
  if (!host.contains(range.commonAncestorContainer)) return
  saved = range.cloneRange()
  refresh()
}

function inHost(node: Node | null): boolean {
  return !!host && !!node && host.contains(node)
}

/** The formatting in force at `node`, read off the elements round it. */
function formatAt(node: Node) {
  const state = { bold: false, italic: false, underline: false, strike: false, color: '', href: '' }
  for (let el = elementOf(node); el && el !== host; el = el.parentElement) {
    const tag = el.tagName
    const style = (el as HTMLElement).style
    if (tag === 'B' || tag === 'STRONG' || Number(style.fontWeight) >= 600 || style.fontWeight === 'bold') state.bold = true
    if (tag === 'I' || tag === 'EM' || style.fontStyle === 'italic') state.italic = true
    if (tag === 'U' || /underline/.test(style.textDecorationLine || style.textDecoration)) state.underline = true
    if (tag === 'S' || tag === 'STRIKE' || tag === 'DEL' || /line-through/.test(style.textDecorationLine || style.textDecoration)) state.strike = true
    if (!state.color) state.color = normaliseColor(style.color || (tag === 'FONT' ? el.getAttribute('color') : '')) ?? ''
    if (!state.href && tag === 'A') state.href = normaliseHref(el.getAttribute('href')) ?? ''
  }
  return state
}

/**
 * Whether the box already carries this style all over, as a property of its
 * own. Inside such a box the browser's command would turn the style *off* for
 * the selection — as a span saying "not bold" — which the allowlist has no
 * word for, and which no export could carry. So there the style is the box's
 * to change, not the selection's: see toggleInline.
 */
export function boxHas(kind: TInlineKind): boolean {
  if (!host) return false
  const style = getComputedStyle(host)
  switch (kind) {
    case 'bold':
      return style.fontWeight === 'bold' || Number(style.fontWeight) >= 600
    case 'italic':
      return style.fontStyle === 'italic'
    case 'underline':
      return /underline/.test(style.textDecorationLine)
    case 'strike':
      return /line-through/.test(style.textDecorationLine)
  }
}

/** The element a collapsed selection sits in, when that element is a link. */
function linkAround(node: Node | null): HTMLAnchorElement | null {
  const link = elementOf(node)?.closest('a')
  return link && inHost(link) ? (link as HTMLAnchorElement) : null
}

function refresh() {
  if (!host || !saved || !inHost(saved.startContainer) || !inHost(saved.endContainer)) {
    saved = null
    Object.assign(inlineState, { selected: false, bold: false, italic: false, underline: false, strike: false, color: '', href: '', rect: null })
    return
  }
  const format = formatAt(saved.startContainer)
  // A style the whole box carries shows on the button too; it is what the
  // selection is, however it got that way.
  for (const kind of ['bold', 'italic', 'underline', 'strike'] as TInlineKind[]) format[kind] ||= boxHas(kind)
  const link = linkAround(saved.startContainer)
  // A caret has no box; a caret inside a link stands for the whole link.
  const box = saved.collapsed ? link?.getBoundingClientRect() : saved.getBoundingClientRect()
  Object.assign(inlineState, {
    ...format,
    selected: !saved.collapsed,
    rect: box && (box.width || box.height) ? { left: box.left, top: box.top, width: box.width, height: box.height } : null,
  })
}

/** Puts the last selection back in the box, and the focus with it. */
function restore(): boolean {
  if (!host || !saved || !inHost(saved.startContainer) || !inHost(saved.endContainer)) return false
  const range = saved.cloneRange()
  host.focus({ preventScroll: true })
  const selection = document.getSelection()
  if (!selection) return false
  selection.removeAllRanges()
  selection.addRange(range)
  return true
}

/** A caret inside a link is widened to the link, so Remove takes it all off. */
function widenToLink() {
  const selection = document.getSelection()
  if (!selection || !selection.isCollapsed) return
  const link = linkAround(selection.anchorNode)
  if (!link) return
  const range = document.createRange()
  range.selectNodeContents(link)
  selection.removeAllRanges()
  selection.addRange(range)
}

/** Reads back where the command left the selection, which is the run it changed. */
function settle() {
  const selection = document.getSelection()
  if (selection && selection.rangeCount && inHost(selection.getRangeAt(0).commonAncestorContainer)) {
    saved = selection.getRangeAt(0).cloneRange()
  }
  refresh()
}

/**
 * Bold, italic, underline or strikethrough on the selection; on a bare caret,
 * on whatever is typed next. False when there is no selection to put back, or
 * when the box carries the style itself (see boxHas); either way the caller
 * falls back to the whole box.
 */
export function toggleInline(kind: TInlineKind): boolean {
  if (boxHas(kind) || !restore()) return false
  document.execCommand(COMMANDS[kind], false)
  settle()
  return true
}

export function colourInline(color: string): boolean {
  if (!restore()) return false
  // As a styled span rather than a <font> tag: both are read, but the span is
  // what the stored form is, so the box is not rewritten under the caret.
  document.execCommand('styleWithCSS', false, 'true')
  document.execCommand('foreColor', false, color)
  document.execCommand('styleWithCSS', false, 'false')
  settle()
  return true
}

export function linkInline(url: string): boolean {
  const href = normaliseHref(url)
  if (!href || !restore()) return false
  widenToLink()
  document.execCommand('createLink', false, href)
  settle()
  return true
}

export function unlinkInline(): boolean {
  if (!restore()) return false
  widenToLink()
  document.execCommand('unlink', false)
  settle()
  return true
}
