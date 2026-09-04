/**
 * What the design being edited is for, when the host has said.
 *
 * The editor on its own makes anything and starts on a slide-shaped page,
 * which is right for a tool with a page-size dialog in it. Inside the planner
 * the answer is already known — the user pressed "make a presentation" or
 * "make a sign" two screens ago — and three things should follow from it: the
 * page starts the right size, the template gallery offers the right templates,
 * and a poster does not offer to be presented full screen.
 *
 * Held here rather than in `config.ts` because two of those three are read from
 * components that re-render when it changes.
 */
import { proxy } from 'valtio'
import type { DesignKind } from '@/compose/types'
import { POSTER_PAGE, SLIDE_PAGE } from '@/compose/types'
import { canvasState, widgetState } from './state'

export const documentKindState = proxy<{ kind: DesignKind | null }>({ kind: null })

/** The template categories each kind offers. `null` offers all of them. */
export const KIND_CATEGORIES: Record<DesignKind, string[]> = {
  slides: ['slide'],
  poster: ['poster', 'flyer', 'sign', 'award'],
}

/** Whether this design is one somebody stands up and presents. */
export function isPresentable(): boolean {
  return documentKindState.kind !== 'poster'
}

/**
 * Sets the kind, and the page size that goes with it.
 *
 * Only on a blank canvas: a design that already has artwork on it has a size
 * somebody chose, and resizing it out from under them is what the Resize dialog
 * is for. The page object is shared between the canvas store and the first
 * layout, so writing to it once is enough.
 */
export function setDocumentKind(kind: DesignKind | null) {
  documentKindState.kind = kind
  if (!kind) return
  const blank = widgetState.dLayouts.length === 1 && widgetState.dLayouts[0].layers.length === 0
  if (!blank) return
  const size = kind === 'poster' ? POSTER_PAGE : SLIDE_PAGE
  canvasState.dPage.width = size.width
  canvasState.dPage.height = size.height
  widgetState.dLayouts[0].global.width = size.width
  widgetState.dLayouts[0].global.height = size.height
}
