import { useEffect } from 'react'
import historyFactory from '@/utils/widgets/diffLayouts'
import { changeHistory, clearHistory } from '@/store/history'
import { widgetState } from '@/store/state'

const blackClass: string[] = ['operation-item', 'icon-undo', 'icon-redo']
const whiteKey: string[] = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Backspace', 'Delete', 'v']

const diffLayouts = new historyFactory()

let processing = false
let historyTimer: any = null

// Wired as the module loads rather than when the editor mounts, so a change
// recorded through recordHistory is recorded whether or not the hook below has
// run yet — a host's applyOps can arrive in the same tick the editor appears.
diffLayouts.onmessage((changes: any) => {
  changes.patches.length > 0 && changeHistory(changes)
  processing = false
})

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
  diffLayouts.reset()
  processing = false
  clearHistory()
}

function noPutHistory(target: any) {
  const classList = Array.from(target.classList || [])
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
 * An empty diff is not an entry, so a press that turned into nothing costs a
 * press of Ctrl+Z later.
 */
export function beginHistory() {
  clearTimeout(historyTimer)
  diffLayouts.postMessage({ op: 'diff', data: JSON.stringify(widgetState.dLayouts) })
}

export function endHistory() {
  diffLayouts.postMessage({ op: 'done', data: JSON.stringify(widgetState.dLayouts) })
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

export default function useHistory() {
  useEffect(() => {
    resetHistory()

    const onMouseDown = (e: any) => {
      if (noPutHistory(e.target)) return
      diffLayouts.postMessage(!processing ? { op: 'diff', data: JSON.stringify(widgetState.dLayouts) } : null)
      processing = true
    }
    const onMouseUp = (e: any) => {
      if (noPutHistory(e.target)) return
      clearTimeout(historyTimer)
      historyTimer = setTimeout(() => {
        diffLayouts.postMessage({ op: 'done', data: JSON.stringify(widgetState.dLayouts) })
      }, 150)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (!whiteKey.includes(e.key)) return
      diffLayouts.postMessage(!processing ? { op: 'diff', data: JSON.stringify(widgetState.dLayouts) } : null)
      processing = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (!whiteKey.includes(e.key)) return
      clearTimeout(historyTimer)
      historyTimer = setTimeout(() => {
        diffLayouts.postMessage({ op: 'done', data: JSON.stringify(widgetState.dLayouts) })
      }, 150)
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
