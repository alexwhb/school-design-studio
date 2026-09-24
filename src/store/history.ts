import { applyPatches, enablePatches } from 'immer'
import { historyState, widgetState } from './state'
import { setDLayouts } from './widget/widget'
import type { TdLayout } from './types'

enablePatches()

export function changeHistory({ patches, inversePatches }: { patches: any; inversePatches: any }) {
  const { dHistoryParams: params, dHistoryStack: stack } = historyState
  const pointer = ++params.stackPointer
  stack.changes.length = pointer
  stack.inverseChanges.length = pointer
  stack.changes[pointer] = patches
  stack.inverseChanges[pointer] = inversePatches
  // The oldest step goes once there are more than the stack holds. A step is
  // the patch between two states rather than a copy of either, so this is not
  // about any one entry's size; it is about a morning's editing never being
  // let off the leash.
  const over = stack.changes.length - params.maxLength
  if (over > 0) {
    stack.changes.splice(0, over)
    stack.inverseChanges.splice(0, over)
    params.stackPointer -= over
  }
}

/**
 * Forgets every step.
 *
 * The stack is a list of patches, and a patch is only meaningful against the
 * document it was taken from — undoing one of them onto a different design
 * either writes one design's changes into another or throws halfway. So the
 * stack goes whenever the design underneath it is replaced wholesale, and when
 * the editor that built it goes away: the store is a module, and outlives any
 * one mount of the editor.
 */
export function clearHistory() {
  historyState.dHistoryParams.stackPointer = -1
  historyState.dHistoryStack.changes = []
  historyState.dHistoryStack.inverseChanges = []
}

/**
 * One step back or forward, or nothing at all.
 *
 * The new layouts are worked out on a plain copy before the store is touched,
 * and the pointer moves only once they are on the canvas. A step that cannot be
 * applied — a patch naming a page that is no longer there — used to throw
 * between the two, which left the design swapped and the pointer where it was,
 * so the next Ctrl+Z tried the same patch again and undo was dead from then on.
 * A step like that means the stack no longer describes the design, so it is
 * dropped whole rather than retried.
 */
export function handleHistory(action: 'undo' | 'redo') {
  const params = historyState.dHistoryParams
  const { changes, inverseChanges } = historyState.dHistoryStack
  const index = params.stackPointer
  const patches = action === 'undo' ? (index >= 0 ? inverseChanges[index] : undefined) : index < changes.length - 1 ? changes[index + 1] : undefined
  if (!patches) return

  let next: TdLayout[]
  try {
    const current = JSON.parse(JSON.stringify(widgetState.dLayouts))
    next = JSON.parse(JSON.stringify(applyPatches(current, patches)))
    if (!Array.isArray(next) || next.length === 0) throw new Error('a step left the design with no pages')
  } catch (error) {
    console.warn('[design] an undo step no longer fits this design; the history has been cleared', error)
    clearHistory()
    return
  }

  setDLayouts(next)
  params.stackPointer = action === 'undo' ? index - 1 : index + 1
}

export function pushColorToHistory(color: string) {
  const history = historyState.dColorHistory
  const index = history.indexOf(color)
  if (index !== -1) {
    history.splice(index, 1)
  }
  if (history.length === 4) {
    history.splice(history.length - 1, 1)
  }
  const head = [color]
  historyState.dColorHistory = head.concat(history)
}
