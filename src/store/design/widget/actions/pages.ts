/*
 * Everything that happens to a page as a whole: adding, duplicating, deleting,
 * reordering, renaming, and moving between them.
 *
 * This lived inside multipleBoards.vue, which meant the page strip was the only
 * thing that could operate on pages and the rules came apart if anything else
 * tried. Keeping the current page index, the widget list and the canvas store's
 * copy of the page in step is four statements in a particular order, and every
 * one of these actions needs it — so it is written once, in `showPage`, and the
 * rest call it.
 */
import { useCanvasStore, useControlStore } from '@/store'
import type { TPageState } from '@/store/design/canvas/d'
import type { TWidgetStore, TdLayout } from '..'

/**
 * A ceiling rather than a limit anyone should meet.
 *
 * Upstream stopped at nine, which is too few for anything presentation-shaped —
 * a term's worth of assembly slides is more than nine. Every page is held in
 * memory and written into the autosave, so a design of a thousand pages would
 * be a way to run the browser out of storage rather than a feature.
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
 */
export function showPage(store: TWidgetStore, index: number) {
  const canvasStore = useCanvasStore()
  const controlStore = useControlStore()
  const target = Math.max(0, Math.min(index, store.dLayouts.length - 1))

  controlStore.setShowMoveable(false) // Clear the previous selection box
  canvasStore.setDCurrentPage(target)
  store.setDWidgets(store.getWidgets())
  canvasStore.setDPage(store.dLayouts[target].global)
  store.selectWidget({ uuid: '-1' })
}

/** Adds an empty page after the current one and moves to it. */
export function addPage(store: TWidgetStore) {
  if (store.dLayouts.length >= MAX_PAGES) return
  const canvasStore = useCanvasStore()
  const after = canvasStore.dCurrentPage
  store.dLayouts.splice(after + 1, 0, { global: blankPageLike(store.dLayouts[after].global), layers: [] })
  showPage(store, after + 1)
}

/**
 * Copies a page, artwork and all, and moves to the copy.
 *
 * Every widget needs a new uuid: two copies of the same id on one design would
 * fight over selection, and grouped elements point at their container by id, so
 * the whole page is renumbered together and the parent links are rewritten to
 * match.
 */
export function duplicatePage(store: TWidgetStore, index: number) {
  if (store.dLayouts.length >= MAX_PAGES) return
  const source = store.dLayouts[index]
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

  store.dLayouts.splice(index + 1, 0, copy)
  showPage(store, index + 1)
}

/**
 * Removes a page.
 *
 * The last page is emptied rather than removed: a design with no pages has
 * nothing to draw and every part of the editor assumes there is a current one.
 */
export function removePage(store: TWidgetStore, index: number) {
  const canvasStore = useCanvasStore()
  if (!store.dLayouts[index]) return

  if (store.dLayouts.length === 1) {
    store.dLayouts[0].layers.length = 0
    showPage(store, 0)
    return
  }

  store.dLayouts.splice(index, 1)
  // Stay where you were looking. Deleting the page you are on moves you to the
  // one that took its place, or back one if it was the last.
  const next = canvasStore.dCurrentPage > index ? canvasStore.dCurrentPage - 1 : Math.min(canvasStore.dCurrentPage, store.dLayouts.length - 1)
  showPage(store, next)
}

/** Moves a page to another position, keeping the same page on screen. */
export function movePage(store: TWidgetStore, from: number, to: number) {
  const target = Math.max(0, Math.min(to, store.dLayouts.length - 1))
  if (from === target || !store.dLayouts[from]) return
  const [moved] = store.dLayouts.splice(from, 1)
  store.dLayouts.splice(target, 0, moved)
  showPage(store, target)
}

/** Names a page. Blank means unnamed, which shows as its number instead. */
export function renamePage(store: TWidgetStore, index: number, name: string) {
  const page = store.dLayouts[index]?.global
  if (page) page.name = name.trim()
}
