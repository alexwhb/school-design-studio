/*
 * Find and replace, across every page of a design.
 *
 * The whole point of the feature is the pages you are *not* looking at: a date
 * that moved has to change on all twenty-five slides, and one missed on page
 * nineteen is a reprint. So there is deliberately no separate path for the
 * current page. `getWidgets()` hands back `dLayouts[dCurrentPage].layers` by
 * reference, so the array the canvas is drawing *is* one of the arrays walked
 * here — mutate through `dLayouts` and the page on screen updates like any
 * other, with no special case to get wrong.
 *
 * Grouped elements need no handling either: a group's children sit in the same
 * flat `layers` array with `parent` pointing at their container.
 *
 * A table is searched cell by cell. Each cell holds the same contentEditable
 * markup a text box does, so the same walk over the markup serves both; what
 * differs is only where the words are read from and written back to, which is
 * what `textSlots` describes. Page names and speaker notes are not searched:
 * neither is on the page.
 */
import { canvasState, widgetState } from '../state'
import { showPage } from './pages'
import { selectWidget } from './select'
import { findInMarkup, replaceInMarkup, type TTextHit } from '@/utils/widgets/textMatch'
import type { TdWidgetData } from '../types'
import { readTable, setCell } from '@/components/modules/widgets/wTable/tableModel'

export type TSearchScope = 'all' | 'page'

export type TFindOptions = {
  query: string
  matchCase: boolean
  scope: TSearchScope
}

export type TFindMatch = TTextHit & {
  page: number
  uuid: string
  /** Which cell of a table holds it, as [row, column]. Absent for a text box. */
  cell?: [number, number]
  /**
   * Whether the layer holding it is hidden or locked. Both are still searched —
   * hiding is about the canvas and locking is about dragging, neither is about
   * the words — but a count of things the person cannot see on screen is
   * baffling unless it is said out loud.
   */
  unseen: boolean
}

export type TReplaceOutcome = {
  replaced: number
  pages: number
  unseen: number
}

/**
 * One run of markup a search can look in and a replacement can be written
 * back to: a text box's `text`, or one cell of a table.
 */
type TTextSlot = {
  cell?: [number, number]
  read: () => string | undefined
  write: (html: string) => void
}

/**
 * The words a widget carries. A text box has one run; a table has one per
 * cell; everything else has none. The field test rather than the type test
 * alone is what keeps this honest if another type gains a `text`.
 */
function textSlots(widget: TdWidgetData): TTextSlot[] {
  if (widget.type === 'w-text' && typeof widget.text === 'string') {
    return [{ read: () => widget.text, write: (html) => (widget.text = html) }]
  }
  if (widget.type === 'w-table') {
    const { cells } = readTable(widget)
    const slots: TTextSlot[] = []
    cells.forEach((line, r) =>
      line.forEach((_, c) =>
        slots.push({
          cell: [r, c],
          read: () => readTable(widget).cells[r]?.[c],
          // A fresh grid rather than a cell written in place, so the canvas
          // and the thumbnails see the array change.
          write: (html) => (widget.cells = setCell(readTable(widget).cells, r, c, html)),
        }),
      ),
    )
    return slots
  }
  return []
}

function slotIn(widget: TdWidgetData, cell?: [number, number]): TTextSlot | undefined {
  return textSlots(widget).find((slot) => (cell ? slot.cell?.[0] === cell[0] && slot.cell?.[1] === cell[1] : !slot.cell))
}

/** Every occurrence, in reading order: page by page, layer by layer, left to right. */
export function findMatches({ query, matchCase, scope }: TFindOptions): TFindMatch[] {
  if (!query) return []
  const matches: TFindMatch[] = []
  const pages = scope === 'page' ? [canvasState.dCurrentPage] : widgetState.dLayouts.map((_, index) => index)

  for (const page of pages) {
    const layers = widgetState.dLayouts[page]?.layers
    if (!layers) continue
    for (const layer of layers) {
      for (const slot of textSlots(layer)) {
        for (const hit of findInMarkup(slot.read(), query, matchCase)) {
          matches.push({ ...hit, page, uuid: layer.uuid, cell: slot.cell, unseen: !!layer.hidden || !!layer.lock })
        }
      }
    }
  }
  return matches
}

/** How many distinct pages a set of matches falls on. */
export function pagesTouched(matches: TFindMatch[]): number {
  return new Set(matches.map((match) => match.page)).size
}

/**
 * Puts a match on screen: the page it is on, and the box that holds it
 * selected, so it can be read in context rather than taken on trust.
 *
 * `showPage` is the only correct way to change page — it keeps the page index,
 * the widget list and the canvas store's copy of the page in step, in that
 * order — and it clears the selection on the way, which is why the box is
 * chosen afterwards rather than before.
 */
export function revealMatch(match: TFindMatch) {
  if (canvasState.dCurrentPage !== match.page) showPage(match.page)
  selectWidget({ uuid: match.uuid })
}

function layerAt(page: number, uuid: string): TdWidgetData | undefined {
  return widgetState.dLayouts[page]?.layers.find((layer) => layer.uuid === uuid)
}

/**
 * Rewrites one occurrence. Not wrapped in history itself — the caller decides
 * how much of a change one undo should take back.
 */
export function applyReplace(match: TFindMatch, replacement: string): boolean {
  const layer = layerAt(match.page, match.uuid)
  const slot = layer && slotIn(layer, match.cell)
  if (!slot) return false
  slot.write(replaceInMarkup(slot.read(), [{ start: match.start, length: match.length }], replacement))
  return true
}

/**
 * Rewrites every occurrence given.
 *
 * Grouped by run of markup — a text box, or one cell of a table — so each is
 * parsed and re-serialised once rather than once per hit, and so the hits inside it are spliced together —
 * `replaceInMarkup` works back to front, which is what keeps the earlier
 * offsets true after the later ones have moved.
 */
export function applyReplaceAll(matches: TFindMatch[], replacement: string): TReplaceOutcome {
  const byLayer = new Map<string, TFindMatch[]>()
  for (const match of matches) {
    const key = `${match.page}:${match.uuid}:${match.cell ? match.cell.join(',') : ''}`
    const list = byLayer.get(key)
    if (list) list.push(match)
    else byLayer.set(key, [match])
  }

  let replaced = 0
  const pages = new Set<number>()
  let unseen = 0
  for (const list of byLayer.values()) {
    const layer = layerAt(list[0].page, list[0].uuid)
    const slot = layer && slotIn(layer, list[0].cell)
    if (!slot) continue
    slot.write(
      replaceInMarkup(
        slot.read(),
        list.map(({ start, length }) => ({ start, length })),
        replacement,
      ),
    )
    replaced += list.length
    pages.add(list[0].page)
    if (list[0].unseen) unseen += list.length
  }
  return { replaced, pages: pages.size, unseen }
}
