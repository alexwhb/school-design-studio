import { useEffect } from 'react'
import { snapshot } from 'valtio'
import type { Patch } from 'immer'
import diffLayouts from '@/utils/widgets/diffLayouts'
import { changeHistory, clearHistory } from '@/store/history'
import { widgetState } from '@/store/state'
import { layoutsRevision } from '@/store/revision'
import { TRANSIENT_FIELDS } from '@/store/transient'
import { isEditorKeyTarget, isEditorPointerTarget } from './appRoot'

const blackClass: string[] = ['operation-item', 'icon-undo', 'icon-redo']
const whiteKey: string[] = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Backspace', 'Delete', 'v']

/**
 * The design as it was when a press began, and how far the design had got.
 *
 * A snapshot rather than a string. valtio's snapshots share every part that
 * has not changed since the last one was taken, so opening a bracket costs
 * next to nothing, where writing the design out as JSON cost the whole design
 * on every mousedown. The JSON is only written if the bracket closes on a
 * design that actually moved — see `endHistory`.
 */
type Bracket = { before: unknown; revision: number }

let open: Bracket | null = null
let historyTimer: ReturnType<typeof setTimeout> | undefined

/**
 * Keys the undo history does not see. The editing flags change as a box is
 * clicked into and out of, which is not something to undo — and undoing it
 * would put a box back into a state the widget holding it no longer agrees
 * with.
 */
const IGNORED = new Set(TRANSIENT_FIELDS)

function plain(layouts: unknown): unknown {
  return JSON.parse(JSON.stringify(layouts, (key, value) => (IGNORED.has(key) ? undefined : value)))
}

function openBracket() {
  open = { before: snapshot(widgetState.dLayouts), revision: layoutsRevision() }
}

/**
 * Starts the undo history again from nothing: the stack, and any press still
 * waiting to be written down.
 *
 * For when the design underneath is replaced by a different one, and for when
 * the editor mounts and unmounts. The stack lives in a module rather than in
 * the component, so without this a second editor on the same page — or the
 * same one opened again — inherited the last one's steps, and Ctrl+Z applied
 * one design's patches to another.
 */
export function resetHistory() {
  clearTimeout(historyTimer)
  open = null
  clearHistory()
}

function noPutHistory(target: any) {
  const classList = Array.from(target?.classList || [])
  return classList.filter((v: any) => blackClass.includes(v)).length > 0
}

/**
 * Where a change no pointer or key event brackets begins, and where it ends.
 *
 * The pair below are ordinary bubble listeners on the document, so a control
 * that stops a press from propagating — which anything laid over the canvas has
 * to, or the board underneath selects and starts dragging what the press was
 * meant for — takes its own undo entry with it. Such a control marks the two
 * ends itself: the shape tool between the press that starts a box and the
 * release that puts it on the page, a corner grip either side of the drag that
 * rounds it.
 *
 * A bracket already open is closed first, so whatever it saw is its own step
 * rather than being folded into this one or lost.
 *
 * An empty diff is not an entry, so a press that turned into nothing costs a
 * press of Ctrl+Z later.
 */
export function beginHistory() {
  clearTimeout(historyTimer)
  if (open) endHistory()
  openBracket()
}

export function endHistory() {
  clearTimeout(historyTimer)
  const bracket = open
  open = null
  // Nothing under dLayouts moved, which is most presses: a click on a panel,
  // a selection, a scroll. No JSON at all.
  if (!bracket || bracket.revision === layoutsRevision()) return
  const step = diffPages(bracket.before as readonly unknown[], snapshot(widgetState.dLayouts) as readonly unknown[])
  if (step.patches.length > 0) changeHistory(step)
}

/**
 * The step between two snapshots of the design, worked out page by page.
 *
 * A snapshot shares every page that did not change with the one before it, so
 * a page that is the same object on both sides is the same page and is not
 * looked at. Nudging one widget on a fifty-page deck writes out and compares
 * one page rather than fifty. When pages were added, removed or reordered the
 * whole design is compared, as it always was.
 */
function diffPages(before: readonly unknown[], after: readonly unknown[]): { patches: Patch[]; inversePatches: Patch[] } {
  if (before.length !== after.length) return diffLayouts(plain(before), plain(after))
  const patches: Patch[] = []
  const inversePatches: Patch[] = []
  for (let index = 0; index < after.length; index++) {
    if (before[index] === after[index]) continue
    const page = diffLayouts(plain(before[index]), plain(after[index]))
    patches.push(...page.patches.map((patch) => ({ ...patch, path: [index, ...patch.path] })))
    inversePatches.push(...page.inversePatches.map((patch) => ({ ...patch, path: [index, ...patch.path] })))
  }
  // Each page's inverse patches are in the order immer means them to be
  // applied, and no two pages share a path, so they are kept as they come.
  return { patches, inversePatches }
}

/**
 * The two together, for a change that happens all at once — one committed from
 * an inline editor or a dialog, which the pair below would otherwise never see.
 */
export function recordHistory(change: () => void) {
  beginHistory()
  change()
  endHistory()
}

/** Closes the open bracket after a moment, so a burst of presses is one step. */
function endSoon() {
  clearTimeout(historyTimer)
  historyTimer = setTimeout(endHistory, 150)
}

export default function useHistory() {
  useEffect(() => {
    resetHistory()

    // Only presses and keys that are the editor's. Embedded, the page round it
    // is the host's, and a click on the host's sidebar is not a step of undo.
    const onMouseDown = (e: MouseEvent) => {
      if (!isEditorPointerTarget(e.target) || noPutHistory(e.target)) return
      // A press that follows the last one within the moment is the same step.
      clearTimeout(historyTimer)
      if (!open) openBracket()
    }
    const onMouseUp = (e: MouseEvent) => {
      if (!open || noPutHistory(e.target)) return
      endSoon()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (!whiteKey.includes(e.key) || !isEditorKeyTarget(e.target)) return
      clearTimeout(historyTimer)
      if (!open) openBracket()
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (!open || !whiteKey.includes(e.key)) return
      endSoon()
    }

    document.addEventListener('mousedown', onMouseDown, false)
    document.addEventListener('mouseup', onMouseUp, false)
    document.addEventListener('keydown', onKeyDown, false)
    document.addEventListener('keyup', onKeyUp, false)

    return () => {
      resetHistory()
      document.removeEventListener('mousedown', onMouseDown, false)
      document.removeEventListener('mouseup', onMouseUp, false)
      document.removeEventListener('keydown', onKeyDown, false)
      document.removeEventListener('keyup', onKeyUp, false)
    }
  }, [])
}
