/**
 * A number that moves whenever the design does, and at no other time.
 *
 * Two things want to know whether the design has changed: the undo history,
 * at the end of every press, and the dirty check, after every change to the
 * store. Both used to find out by writing the whole design out as JSON and
 * comparing strings — on every mousedown anywhere on the page, every arrow
 * key, and every change to the widget store, which includes the selection and
 * the widget under the pointer. On a deck with photographs in it that is
 * megabytes of string per mouse movement over the canvas.
 *
 * This is the cheap question they ask first. It counts mutations under
 * `dLayouts` — synchronously, so a change made and checked in the same tick is
 * seen — and a swap of `dLayouts` for another array counts as one. A selection
 * or a hover is not under `dLayouts` and does not move it. Only when it has
 * moved does anybody need to look at the design itself.
 */
import { subscribe } from 'valtio'
import { widgetState } from './state'

let revision = 0
let watched: object | null = null
let unwatch: (() => void) | null = null
let started = false
const listeners = new Set<() => void>()
let notifyQueued = false

function notify() {
  // Listeners are told once per burst rather than once per mutation: a drag
  // writes left and top on every pointer move, and each listener only wants to
  // know that something moved.
  if (notifyQueued) return
  notifyQueued = true
  queueMicrotask(() => {
    notifyQueued = false
    listeners.forEach((listener) => listener())
  })
}

function bump() {
  revision++
  notify()
}

/** Follows `dLayouts` to whatever array it is now. */
function follow() {
  const layouts = widgetState.dLayouts
  if (layouts === watched) return
  unwatch?.()
  watched = layouts
  unwatch = subscribe(layouts, bump, true)
  bump()
}

function start() {
  if (started) return
  started = true
  follow()
  // Only to notice `dLayouts` being replaced, which is an identity check.
  subscribe(widgetState, follow, true)
}

/** The current revision of the design. Equal twice means nothing changed in between. */
export function layoutsRevision(): number {
  start()
  follow()
  return revision
}

/** Called, once per burst of changes, whenever the design changes. */
export function onLayoutsChange(listener: () => void): () => void {
  start()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
