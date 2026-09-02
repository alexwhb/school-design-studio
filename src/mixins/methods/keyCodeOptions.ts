import { controlState, widgetState } from '@/store/state'
import { setDrawTool, setSpaceDown, toggleDrawTool } from '@/store/control'
import { deleteWidget, lockWidgets, updateWidgetData } from '@/store/widget/widget'
import { clearSelection } from '@/store/widget/select'
import { escapeHitOverlay } from '../overlayEscape'
import type { TdWidgetData } from '@/store/types'
import { getAppRoot } from '@/common/hooks/appRoot'



export default function keyCodeOptions(e: any, params: any) {
  const { range } = params
  switch (e.keyCode) {
    case 38:
      udlr('top', -1 * range, e)
      break
    case 40:
      udlr('top', Number(range), e)
      break
    case 37:
      udlr('left', -1 * range, e)
      break
    case 39:
      udlr('left', Number(range), e)
      break
    case 27:
      escape()
      break
    // R, as it is in Adobe XD. Pressed again it puts the pointer back, so the
    // key that arms the tool is also the key that gets you out of it.
    case 82:
      if (!isTyping()) toggleDrawTool('rect')
      break
    case 46:
    case 8:
      {
        if (widgetState.dActiveElement?.isContainer) {
          if (checkGroupChild(widgetState.dActiveElement?.uuid, 'editable')) {
            return
          }
        }
        if (!widgetState.dActiveElement) return
        const { type, editable } = widgetState.dActiveElement

        if (type === 'w-text') {
          !editable && controlState.showMoveable && deleteWidget()
        } else {
          deleteWidget()
        }
      }
      break
  }

  if (e.key === ' ') {
    dealWithSpace(e)
  }
}

/**
 * True while somebody is typing into the artwork, so a letter is a letter
 * rather than a shortcut.
 *
 * The caller's own guard misses this: it tests `contentEditable === 'true'`,
 * and a text layer is `plaintext-only`. Every other key handled here already
 * checks `editable` for itself, and Escape wants the keystroke precisely so it
 * can end the edit — so the guard is fixed here rather than there, where
 * widening it would take Escape away from the text it is meant to leave.
 */
function isTyping() {
  return !!(document.activeElement as HTMLElement | null)?.isContentEditable
}

/**
 * Escape backs out one step, the way it does in a design tool: text being
 * edited goes back to being a layer you have selected, an armed tool goes back
 * to the pointer, and a selection — one layer or a whole boxful — goes back to
 * nothing.
 *
 * Anything laid over the editor gets Escape first and closes on it, and what is
 * selected underneath should still be there afterwards.
 */
function escape() {
  const editing = document.activeElement as HTMLElement | null
  if (editing?.isContentEditable) {
    editing.blur()
    return
  }
  if (escapeHitOverlay()) return
  // An armed tool has nothing selected behind it to drop, so this is the whole
  // step rather than the first half of one.
  if (controlState.dDrawTool) {
    setDrawTool(null)
    return
  }
  clearSelection()
}

function checkGroupChild(pid: number | string, key: keyof TdWidgetData) {
  let itHas = false
  const childs = widgetState.dWidgets.filter((x) => x.parent === pid) || []
  childs.forEach((element) => {
    element[key] && (itHas = true)
  })
  return itHas
}

function udlr(type: keyof TdWidgetData, value: any, event: any) {
  if (!widgetState.dActiveElement) return
  if (Number(widgetState.dActiveElement.uuid) != -1) {
    if (widgetState.dActiveElement.editable) {
      return
    } else if (widgetState.dActiveElement.isContainer && checkGroupChild(widgetState.dActiveElement.uuid, 'editable')) {
      return
    }
    event.preventDefault()
    const result = Number(widgetState.dActiveElement[type]) + value
    updateWidgetData({
      uuid: widgetState.dActiveElement.uuid,
      key: type,
      value: result,
    })
  }
}

function dealWithSpace(event: any) {
  if (!widgetState.dActiveElement?.editable) {
    event.preventDefault()
    if (widgetState.dActiveElement?.uuid == '-1') {
      getAppRoot()?.classList.add('move-case')
      if (!controlState.dSpaceDown) {
        lockWidgets()
      }
      setSpaceDown(true)
    }
  }
}
