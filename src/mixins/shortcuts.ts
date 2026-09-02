import keyCodeOptions from './methods/keyCodeOptions'
import dealWithCtrl, { type ShortcutInstance } from './methods/dealWithCtrl'
import { controlState, widgetState } from '@/store/state'
import { setSpaceDown, updateAltDown } from '@/store/control'
import { lockWidgets } from '@/store/widget/widget'
import { getAppRoot } from '@/common/hooks/appRoot'

const ignoreNode = ['INPUT', 'TEXTAREA']

let hadDown = false
let checkCtrl: any

export function handleKeydowm(instance: ShortcutInstance) {
  return (e: any) => {
    const nodeName = e.target.nodeName
    // A field is a field and takes every key. Text being edited in the artwork
    // is not: the shortcuts that are still wanted there — Ctrl+S, the zoom, the
    // key that starts the presentation — are wanted precisely while somebody is
    // typing the words. So each case guards itself on `editable` or on whether
    // the caret is in the artwork, and there is no blanket rule here. Upstream
    // had one for a contentEditable div; it never fired, because a text layer
    // used to be `plaintext-only` rather than `true`, and every case was
    // written round its absence.
    if (ignoreNode.indexOf(nodeName) !== -1) {
      return
    }
    const ctrl = e.key === 'Control' || e.key === 'Meta'
    const alt = e.key === 'Alt'
    const shift = e.key === 'Shift'

    if (shift || ctrl) {
      updateAltDown(true)
      clearInterval(checkCtrl)
      checkCtrl = setInterval(() => {
        if (!document.hasFocus()) {
          clearInterval(checkCtrl)
          hadDown = false
          updateAltDown(false)
        }
      }, 500)
    }
    const withCtrl = e.ctrlKey || e.metaKey
    if (withCtrl && !(ctrl || alt || shift)) {
      dealWithCtrl(e, instance)
      return
    }
    const withShift = e.shiftKey

    const range = withShift ? 10 : 1
    keyCodeOptions(e, { range })
  }
}

export function handleKeyup() {
  return (e: any) => {
    clearInterval(checkCtrl)
    hadDown = false
    if (e.key === 'Alt' || e.key === 'Shift' || e.key === 'Control' || e.key === 'Meta') {
      updateAltDown(false)
    }
    if (e.key === ' ' && controlState.dSpaceDown) {
      getAppRoot()?.classList.remove('move-case')
      setSpaceDown(false)
      lockWidgets()
    }
  }
}

export { widgetState }
