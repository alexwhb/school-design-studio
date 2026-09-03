import { controlState, widgetState } from '@/store/state'
import { setDrawTool, setPathEditUuid, setSpaceDown, toggleDrawTool } from '@/store/control'
import { deleteWidget, lockWidgets, updateWidgetData } from '@/store/widget/widget'
import { clearSelection } from '@/store/widget/select'
import { refuseLocked, selectionWidgets } from '@/store/widget/lock'
import { toggleArrowTool } from '@/components/business/tool-dock/arrowTool'
import { escapeHitOverlay } from '../overlayEscape'
import type { TdWidgetData } from '@/store/types'
import { getAppRoot } from '@/common/hooks/appRoot'
import { setUpdateRect } from '@/store/force'



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
    // R, E, Y, P, L and T, as they are in Adobe XD. Pressed again the key puts
    // the pointer back, so the one that arms a tool is also the one that gets
    // you out of it.
    case 82:
      if (!isTyping()) toggleDrawTool('rect')
      break
    case 69:
      if (!isTyping()) toggleDrawTool('ellipse')
      break
    case 89:
      if (!isTyping()) toggleDrawTool('polygon')
      break
    case 80:
      if (!isTyping()) toggleDrawTool('pen')
      break
    case 76:
      if (!isTyping()) toggleDrawTool('line')
      break
    case 84:
      if (!isTyping()) toggleDrawTool('text')
      break
    // A for the arrow, which XD has no key for. The letter is free: Ctrl+A is
    // select-all and is answered before any of this, so the two never meet.
    case 65:
      if (!isTyping()) toggleArrowTool()
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
 * The caller's own guard is about fields — INPUT and TEXTAREA — and text in the
 * artwork is not one: Ctrl+S and the zoom are wanted while somebody is typing
 * the words. So every key handled here checks for itself, this being the check
 * for the ones that are letters.
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
  // The overlay first, and before the text: a picker open over a text box is
  // what the key was aimed at, and taking the caret out of the words being
  // coloured as well is a step nobody asked for.
  if (escapeHitOverlay()) return
  const editing = document.activeElement as HTMLElement | null
  if (editing?.isContentEditable) {
    editing.blur()
    return
  }
  // An armed tool has nothing selected behind it to drop, so this is the whole
  // step rather than the first half of one.
  if (controlState.dDrawTool) {
    setDrawTool(null)
    return
  }
  // A path being edited goes back to being a path you have selected, which is
  // the same step back that a text layer being typed into takes above.
  if (controlState.dPathEditUuid !== '-1') {
    setPathEditUuid('-1')
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

/**
 * The arrow keys. One layer moves on its own; a multi-selection moves as one,
 * every layer by the same step, with the page left where it is. The history
 * hook brackets the key itself, so either is one undo entry per press.
 */
function udlr(type: keyof TdWidgetData, value: any, event: any) {
  if (!widgetState.dActiveElement) return
  const selected = widgetState.dSelectWidgets
  if (Number(widgetState.dActiveElement.uuid) == -1 && selected.length > 1) {
    event.preventDefault()
    if (refuseLocked(selected, 'moved')) return
    for (const item of selected) {
      updateWidgetData({ uuid: item.uuid, key: type, value: Number(item[type]) + value })
    }
    // The box round the selection is Moveable's, and it does not watch the store
    setUpdateRect()
    return
  }
  if (Number(widgetState.dActiveElement.uuid) != -1) {
    if (widgetState.dActiveElement.editable) {
      return
    } else if (widgetState.dActiveElement.isContainer && checkGroupChild(widgetState.dActiveElement.uuid, 'editable')) {
      return
    }
    event.preventDefault()
    if (refuseLocked([widgetState.dActiveElement], 'moved')) return
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
