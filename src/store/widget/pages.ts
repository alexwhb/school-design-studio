/*
 * Everything that happens to a page as a whole: adding, duplicating, deleting,
 * reordering, renaming, and moving between them.
 *
 * This lived inside the page strip, which meant the strip was the only thing
 * that could operate on pages and the rules came apart if anything else tried.
 * Keeping the current page index, the widget list and the canvas store's copy
 * of the page in step is four statements in a particular order, and every one
 * of these actions needs it — so it is written once, in `showPage`, and the
 * rest call it.
 */
import { canvasState, widgetState } from '../state'
import { setDCurrentPage, setDPage } from '../canvas'
import { setShowMoveable } from '../control'
import { setLayoutsChange } from '../force'
import { getWidgets, setDWidgets } from './widget'
import { selectWidget } from './select'
import type { TPageState, TdLayout } from '../types'

/**
 * A ceiling rather than a limit anyone should meet.
 *
 * Upstream stopped at nine, which is too few for anything presentation-shaped —
 * a term's worth of assembly slides is more than nine. Every page is held in
 * memory whether or not it is on screen, so a design of a thousand pages would
 * be a way to run the browser out of memory rather than a feature. The autosave
 * writes only the pages that changed (see localDesigns.ts), so the ceiling is
 * about what the editor holds, not about what it saves.
 */
export const MAX_PAGES = 50

/** A new page inherits the size of the one it is added after, but not its artwork. */
function blankPageLike(page: TPageState): TPageState {
  return {
    ...JSON.parse(JSON.stringify(page)),
    name: 'New page',
    backgroundColor: '#ffffffff',
    backgroundGradient: '',
    backgroundImage: '',
  }
}

/**
 * Makes `index` the page on the canvas.
 *
 * The order matters: the widget list has to be re-read before the canvas store
 * is pointed at the new page, or the board paints one page's artwork at the
 * other page's size for a frame.
 *
 * And the board has to be told the list is a different one. Swapping dWidgets
 * for another page's array is invisible to valtio's snapshot comparison, which
 * looks at the values that were read rather than at the object they were read
 * from: two pages each holding one unhidden top-level layer compare equal, so
 * the board went on drawing the page you had left. It only looked right because
 * changing page usually changes the selection too, which is tracked — edit some
 * text, click away, and switch, and the artwork stayed put.
 */
export function showPage(index: number) {
  const target = Math.max(0, Math.min(index, widgetState.dLayouts.length - 1))

  setShowMoveable(false)
  setDCurrentPage(target)
  setDWidgets(getWidgets())
  setLayoutsChange()
  setDPage(widgetState.dLayouts[target].global)
  selectWidget({ uuid: '-1' })
}

/** Adds an empty page after the current one and moves to it. */
export function addPage() {
  if (widgetState.dLayouts.length >= MAX_PAGES) return
  const after = canvasState.dCurrentPage
  widgetState.dLayouts.splice(after + 1, 0, { global: blankPageLike(widgetState.dLayouts[after].global), layers: [] })
  showPage(after + 1)
}

/**
 * Copies a page, artwork and all, and moves to the copy.
 *
 * Every widget needs a new uuid: two copies of the same id on one design would
 * fight over selection, and grouped elements point at their container by id, so
 * the whole page is renumbered together and the parent links are rewritten to
 * match.
 */
export function duplicatePage(index: number) {
  if (widgetState.dLayouts.length >= MAX_PAGES) return
  const source = widgetState.dLayouts[index]
  if (!source) return

  const copy: TdLayout = JSON.parse(JSON.stringify(source))
  const renamed = new Map<string, string>()
  for (const widget of copy.layers) {
    const fresh = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
    renamed.set(widget.uuid, fresh)
    widget.uuid = fresh
  }
  for (const widget of copy.layers) {
    // '-1' is the page itself, which is not renumbered.
    if (widget.parent && renamed.has(widget.parent)) widget.parent = renamed.get(widget.parent) as string
  }
  copy.global.name = `${source.global.name || 'Page'} copy`

  widgetState.dLayouts.splice(index + 1, 0, copy)
  showPage(index + 1)
}

/**
 * Removes a page.
 *
 * The last page is emptied rather than removed: a design with no pages has
 * nothing to draw and every part of the editor assumes there is a current one.
 */
export function removePage(index: number) {
  if (!widgetState.dLayouts[index]) return

  if (widgetState.dLayouts.length === 1) {
    widgetState.dLayouts[0].layers.length = 0
    showPage(0)
    return
  }

  widgetState.dLayouts.splice(index, 1)
  // Stay where you were looking. Deleting the page you are on moves you to the
  // one that took its place, or back one if it was the last.
  const next =
    canvasState.dCurrentPage > index ? canvasState.dCurrentPage - 1 : Math.min(canvasState.dCurrentPage, widgetState.dLayouts.length - 1)
  showPage(next)
}

/** Moves a page to another position, keeping the same page on screen. */
export function movePage(from: number, to: number) {
  const target = Math.max(0, Math.min(to, widgetState.dLayouts.length - 1))
  if (from === target || !widgetState.dLayouts[from]) return
  const [moved] = widgetState.dLayouts.splice(from, 1)
  widgetState.dLayouts.splice(target, 0, moved)
  showPage(target)
}

/** Names a page. Blank means unnamed, which shows as its number instead. */
export function renamePage(index: number, name: string) {
  const page = widgetState.dLayouts[index]?.global
  if (page) page.name = name.trim()
}
