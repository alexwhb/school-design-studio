import { useRef } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, widgetState } from '@/store/state'
import './resize.less'

type Direction = 'ns' | 'ew'

export default function ResizePage({ width, height }: { width: number; height: number }) {
  const active = useSnapshot(widgetState).dActiveElement
  const show = active?.uuid === '-1'

  const initData = useRef({ x: 0, y: 0, w: 0, h: 0 })
  const moveDir = useRef<Direction>('ns')
  const moveRev = useRef<boolean | undefined>(undefined)

  function handlemousemove(e: MouseEvent) {
    const { x, y, w, h } = initData.current
    if (moveDir.current === 'ew') {
      const dx = e.pageX - x
      const moveX = Math.floor((dx * 100) / canvasState.dZoom)
      const result = moveRev.current ? w - moveX * 2 : w + moveX * 2
      result <= 5000 && result > 0 && (canvasState.dPage.width = result)
    } else {
      const dy = e.pageY - y
      const moveY = Math.floor((dy * 100) / canvasState.dZoom)
      const result = moveRev.current ? h - moveY * 2 : h + moveY * 2
      result <= 5000 && result > 0 && (canvasState.dPage.height = result)
    }
  }

  function stopMove() {
    document.removeEventListener('mousemove', handlemousemove, true)
    document.removeEventListener('mouseup', stopMove, true)
  }

  function handlemousedown(e: React.MouseEvent, dir: Direction, isReverse?: boolean) {
    moveDir.current = dir
    moveRev.current = isReverse
    e.stopPropagation()
    e.preventDefault()
    initData.current = { x: e.pageX, y: e.pageY, w: canvasState.dPage.width, h: canvasState.dPage.height }
    document.addEventListener('mousemove', handlemousemove, true)
    document.addEventListener('mouseup', stopMove, true)
  }

  return (
    <div className="page-resize" style={{ display: show ? undefined : 'none', width: Math.floor(width) + 'px', height: Math.floor(height) + 'px' }}>
      <div onMouseDown={(e) => handlemousedown(e, 'ns', true)} className="resize__bar resize__bar-top" />
      <div onMouseDown={(e) => handlemousedown(e, 'ew')} className="resize__bar resize__bar-right" />
      <div onMouseDown={(e) => handlemousedown(e, 'ns')} className="resize__bar resize__bar-bottom" />
      <div onMouseDown={(e) => handlemousedown(e, 'ew', true)} className="resize__bar resize__bar-left" />
    </div>
  )
}
