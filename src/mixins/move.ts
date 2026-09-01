import { ref } from 'valtio'
import { controlState, widgetState } from '@/store/state'
import { dMove, initDMove } from '@/store/widget/move'
import { stopDMove } from '@/store/control'

function handlemousemove(e: MouseEvent) {
  e.stopPropagation()
  e.preventDefault()
  dMove({ x: e.pageX, y: e.pageY })
}

function handlemouseup() {
  document.removeEventListener('mousemove', handlemousemove, true)
  document.removeEventListener('mouseup', handlemouseup, true)
  stopDMove()
}

export const move = {
  initmovement(e: MouseEvent) {
    const target = widgetState.dActiveElement
    if (!target) return
    initDMove({
      startX: e.pageX,
      startY: e.pageY,
      originX: target.left,
      originY: target.top,
    })
    document.addEventListener('mousemove', handlemousemove, true)
    document.addEventListener('mouseup', handlemouseup, true)
  },
}

export const moveInit = {
  initmovement(e: MouseEvent) {
    if (!controlState.dAltDown) {
      widgetState.activeMouseEvent = ref(e) as MouseEvent
    }

    const target = widgetState.dActiveElement
    if (!target) return
    initDMove({
      startX: e.pageX,
      startY: e.pageY,
      originX: target.left,
      originY: target.top,
    })

    const onUp = () => {
      widgetState.activeMouseEvent = null
      document.removeEventListener('mouseup', onUp, true)
    }
    document.addEventListener('mouseup', onUp, true)
  },
}
