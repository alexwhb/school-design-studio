/*
 * What a page carries about itself besides its artwork: for now, how the
 * presenter arrives at it.
 *
 * It lives on the page's `global`, which is the same object the canvas store
 * points at for the current page — `canvasState.dPage` is
 * `dLayouts[dCurrentPage].global` by reference — so a write here is seen by the
 * settings panel, the page strip and the autosave alike, and the history stack,
 * which diffs `dLayouts`, takes it back with Ctrl+Z like any other change.
 */
import type { TPageTransition } from '@/common/animations/transitions'
import { recordHistory } from '@/common/hooks/history'
import { canvasState, widgetState } from '../state'

/** Sets the current page's transition. Null takes it off rather than leaving a `none` behind. */
export function setPageTransition(transition: TPageTransition | null) {
  const page = canvasState.dPage
  if (transition) page.transition = { ...transition }
  else delete page.transition
}

/**
 * Gives every page the current page's transition. One undo step: a deck
 * re-timed by mistake goes back with one press.
 */
export function applyTransitionToAllPages(): number {
  const source = canvasState.dPage.transition
  const pages = widgetState.dLayouts
  recordHistory(() => {
    for (const layout of pages) {
      if (source) layout.global.transition = { ...source }
      else delete layout.global.transition
    }
  })
  return pages.length
}
