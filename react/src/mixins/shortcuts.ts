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
    if (ignoreNode.indexOf(nodeName) !== -1 || (nodeName === 'DIV' && e.target.contentEditable === 'true')) {
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
