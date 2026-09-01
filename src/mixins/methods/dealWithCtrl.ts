import handlePaste from './handlePaste'
import { widgetState } from '@/store/state'
import { realCombined } from '@/store/group'
import { handleHistory } from '@/store/history'
import { copyWidget, pasteWidget } from '@/store/widget/clone'
import { selectAllWidgets } from '@/store/widget/select'

export type ShortcutInstance = {
  save: () => void
  zoomAdd: () => void
  zoomSub: () => void
  present?: () => void
}

export default function dealWithCtrl(e: KeyboardEvent, _this: ShortcutInstance) {
  switch (e.keyCode) {
    case 65:
      selectAll(e)
      break
    case 71:
      e.preventDefault()
      realCombined()
      break
    case 67:
      copy()
      break
    case 86:
      paste()
      break
    case 90:
      undo(e.shiftKey)
      break
    case 13:
      e.preventDefault()
      _this.present?.()
      break
    case 83:
      e.preventDefault()
      _this.save()
      break
    case 187:
      e.preventDefault()
      _this.zoomAdd()
      break
    case 189:
      e.preventDefault()
      _this.zoomSub()
      break
  }
}

function checkGroupChild(pid: number | string, key: any) {
  let itHas = false
  const childs = widgetState.dWidgets.filter((x) => x.parent === pid) || []
  childs.forEach((element: any) => {
    element[key] && (itHas = true)
  })
  return itHas
}

/**
 * Text being edited keeps the browser's own select-all — its contentEditable is
 * `plaintext-only`, which the INPUT/TEXTAREA guard upstream does not catch, so
 * the check has to happen here the way copy and paste do it.
 */
function selectAll(e: KeyboardEvent) {
  if (widgetState.dActiveElement?.editable) return
  if (widgetState.dActiveElement?.isContainer && checkGroupChild(widgetState.dActiveElement.uuid, 'editable')) return
  e.preventDefault()
  selectAllWidgets()
}

function copy() {
  if (widgetState.dActiveElement?.uuid === '-1') {
    return
  } else if (widgetState.dActiveElement?.isContainer && checkGroupChild(widgetState.dActiveElement?.uuid, 'editable')) {
    return
  }
  !widgetState.dActiveElement?.editable && copyWidget()
}

let pasteImageFile: any = null
if (typeof document !== 'undefined') {
  document.addEventListener('paste', async (e: any) => {
    const file = e.clipboardData.files[0]
    pasteImageFile = file && file.type.startsWith('image') ? file : null
  })
}

async function paste() {
  setTimeout(() => {
    handlePaste(pasteImageFile).then(() => {
      if (widgetState.dCopyElement.length === 0) {
        return
      } else if (widgetState.dActiveElement?.isContainer && checkGroupChild(widgetState.dActiveElement?.uuid, 'editable')) {
        return
      }
      !widgetState.dActiveElement?.editable && pasteWidget()
    })
  }, 10)
}

function undo(shiftKey: any) {
  const { type, editable }: any = widgetState.dActiveElement || {}
  if (type === 'w-text') {
    !editable && (shiftKey ? handleHistory('redo') : handleHistory('undo'))
  } else shiftKey ? handleHistory('redo') : handleHistory('undo')
}
