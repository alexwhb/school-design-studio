import keyCodeOptions from './methods/keyCodeOptions'
import dealWithCtrl, { type ShortcutInstance } from './methods/dealWithCtrl'
import { controlState, widgetState } from '@/store/state'
import { setSpaceDown, updateAltDown } from '@/store/control'
import { lockWidgets } from '@/store/widget/widget'
import { getAppRoot, isEditorKeyTarget } from '@/common/hooks/appRoot'

const ignoreNode = ['INPUT', 'TEXTAREA', 'SELECT']

let hadDown = false
let checkCtrl: any

/** Cmd/Ctrl+S, however the layout spells the letter. */
function isSaveKey(e: KeyboardEvent): boolean {
  return (e.ctrlKey || e.metaKey) && !e.altKey && (e.key === 's' || e.key === 'S' || e.keyCode === 83)
}

export function handleKeydowm(instance: ShortcutInstance) {
  return (e: any) => {
    // Only keys pressed in the editor, or with focus on nothing in particular,
    // which is where it is left after a click on the canvas. Embedded, the
    // rest of the page is the host's, and a Backspace on one of its buttons is
    // not a request to delete the selected widget. See isEditorKeyTarget.
    if (!isEditorKeyTarget(e.target)) return
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
      // Save is the one exception. In the design's name or the speaker notes
      // the browser would otherwise offer to save the page as HTML.
      if (isSaveKey(e)) {
        e.preventDefault()
        instance.save()
      }
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
