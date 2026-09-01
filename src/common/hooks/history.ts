import { useEffect } from 'react'
import historyFactory from '@/utils/widgets/diffLayouts'
import { changeHistory } from '@/store/history'
import { widgetState } from '@/store/state'

const blackClass: string[] = ['operation-item', 'icon-undo', 'icon-redo']
const whiteKey: string[] = ['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Backspace', 'Delete', 'v']

const diffLayouts = new historyFactory()

let processing = false
let historyTimer: any = null

function noPutHistory(target: any) {
  const classList = Array.from(target.classList || [])
  return classList.filter((v: any) => blackClass.includes(v)).length > 0
}

export default function useHistory() {
  useEffect(() => {
    diffLayouts.onmessage((changes: any) => {
      changes.patches.length > 0 && changeHistory(changes)
      processing = false
    })

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
      document.removeEventListener('mousedown', onMouseDown, false)
      document.removeEventListener('mouseup', onMouseUp, false)
      document.removeEventListener('keydown', onKeyDown, false)
      document.removeEventListener('keyup', onKeyUp, false)
    }
  }, [])
}
