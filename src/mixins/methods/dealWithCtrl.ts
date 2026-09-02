import handlePaste from './handlePaste'
import { widgetState } from '@/store/state'
import { realCombined } from '@/store/group'
import { handleHistory } from '@/store/history'
import { copyWidget, duplicateOne, pasteWidget } from '@/store/widget/clone'
import { selectAllWidgets } from '@/store/widget/select'
import { recordHistory } from '@/common/hooks/history'
import { arrangeLayer } from '@/components/modules/settings/ArrangeRow'

export type ShortcutInstance = {
  save: () => void
  zoomAdd: () => void
  zoomSub: () => void
  present?: () => void
  findReplace?: () => void
}

export default function dealWithCtrl(e: KeyboardEvent, _this: ShortcutInstance) {
  switch (e.keyCode) {
    case 65:
      selectAll(e)
      break
    case 70:
      find(e, _this)
      break
    case 71:
      e.preventDefault()
      recordHistory(realCombined)
      break
    case 67:
      copy()
      break
    case 86:
      paste()
      break
    case 68:
      // Ctrl+D is the browser's bookmark dialog, so it has to be taken.
      e.preventDefault()
      duplicate()
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
    // ] and [ step a layer through the stack; with Shift they take it all the way
    case 221:
      e.preventDefault()
      arrange(e.shiftKey ? { key: 'zOrder', value: 'front' } : { key: 'zIndex', value: 1 })
      break
    case 219:
      e.preventDefault()
      arrange(e.shiftKey ? { key: 'zOrder', value: 'back' } : { key: 'zIndex', value: -1 })
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

/**
 * Ctrl+F is the browser's own find bar, so it has to be taken — but only when
 * the caret is not in a text box. A text widget is edited in a contentEditable
 * div, which the INPUT/TEXTAREA guard upstream does not catch, so the check
 * happens here the way select-all does it.
 */
function find(e: KeyboardEvent, _this: ShortcutInstance) {
  if (widgetState.dActiveElement?.editable) return
  if (widgetState.dActiveElement?.isContainer && checkGroupChild(widgetState.dActiveElement.uuid, 'editable')) return
  e.preventDefault()
  _this.findReplace?.()
}

/** The stacking shortcuts act on the one selected layer; a group goes as one. */
function arrange(item: { key: string; value: string | number }) {
  const active = widgetState.dActiveElement
  if (!active || active.uuid === '-1' || active.editable) return
  if (active.isContainer && checkGroupChild(active.uuid, 'editable')) return
  arrangeLayer(active.uuid, item)
}

function copy() {
  if (widgetState.dActiveElement?.uuid === '-1') {
    return
  } else if (widgetState.dActiveElement?.isContainer && checkGroupChild(widgetState.dActiveElement?.uuid, 'editable')) {
    return
  }
  !widgetState.dActiveElement?.editable && copyWidget()
}

function duplicate() {
  if (widgetState.dActiveElement?.uuid === '-1') {
    return
  } else if (widgetState.dActiveElement?.isContainer && checkGroupChild(widgetState.dActiveElement?.uuid, 'editable')) {
    return
  }
  !widgetState.dActiveElement?.editable && recordHistory(duplicateOne)
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
      !widgetState.dActiveElement?.editable && recordHistory(pasteWidget)
    })
  }, 10)
}

function undo(shiftKey: any) {
  const { type, editable }: any = widgetState.dActiveElement || {}
  if (type === 'w-text') {
    !editable && (shiftKey ? handleHistory('redo') : handleHistory('undo'))
  } else shiftKey ? handleHistory('redo') : handleHistory('undo')
}
