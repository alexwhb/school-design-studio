/**
 * The grips between a table's columns, dragged to trade width between the two
 * either side.
 *
 * Each divider is a thin strip standing on the boundary between two columns,
 * held in from the table's top and bottom edges: the selection box draws its
 * own handles on those edges, and a grip that met one there would lose the
 * press to it. The strip is wider than the line it draws so it can be found,
 * and every length is divided back out of the canvas zoom so it stays the same
 * size to aim at whatever the page is scaled to — the same arrangement the
 * rectangle's corner grips use.
 *
 * The press is taken in the capture phase and stopped there, for the reason
 * RadiusHandles gives: the board and Moveable both take a press on the widget
 * from native listeners, and a React handler would run after both had claimed
 * it. The undo entry is bracketed by hand for the same reason.
 */
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { beginHistory, endHistory } from '@/common/hooks/history'
import { canvasState } from '@/store/state'
import { updateTable } from '@/store/widget/table'
import { cx } from '@/utils/dom'
import type { TdWidgetData } from '@/store/types'
import { MIN_COL_PX, dividerOffsets, readTable, resizeColumns } from './tableModel'

/** Screen pixels: how wide the strip is to grab, and how far it stands in from the top and bottom. */
const GRIP_WIDTH = 9
const GRIP_INSET = 14

export default function ColumnDividers({ params }: { params: TdWidgetData }) {
  const p = useSnapshot(params) as Record<string, any>
  const dZoom = useSnapshot(canvasState).dZoom
  const containerRef = useRef<HTMLDivElement | null>(null)
  const release = useRef<(() => void) | null>(null)
  const [dragging, setDragging] = useState<number | null>(null)

  const scale = 100 / (dZoom || 100)
  const offsets = dividerOffsets(readTable(p).colWidths)

  // Re-registered each render so the handler closes over the table's current
  // width, which is what a pointer's travel is measured against.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousedown', startDrag, true)
    return () => el.removeEventListener('mousedown', startDrag, true)
  })

  useEffect(() => () => release.current?.(), [])

  function startDrag(e: MouseEvent) {
    const index = Number((e.target as HTMLElement)?.dataset?.divider)
    if (!Number.isInteger(index)) return
    e.preventDefault()
    e.stopPropagation()

    const start = readTable(params).colWidths
    const startX = e.pageX
    const total = Math.max(1, Number(params.width) || 1)
    beginHistory()
    setDragging(index)

    function move(ev: MouseEvent) {
      ev.preventDefault()
      const zoom = (canvasState.dZoom || 100) / 100
      const delta = (ev.pageX - startX) / zoom / total
      updateTable(params.uuid, { colWidths: resizeColumns(start, index, delta, MIN_COL_PX / total) })
    }

    function stop() {
      document.removeEventListener('mousemove', move, true)
      document.removeEventListener('mouseup', stop, true)
      release.current = null
      endHistory()
      setDragging(null)
    }

    release.current = stop
    document.addEventListener('mousemove', move, true)
    document.addEventListener('mouseup', stop, true)
  }

  return (
    <div className="w-table__dividers" ref={containerRef}>
      {offsets.map((offset, index) => (
        <div
          key={index}
          className={cx('w-table__divider', { 'is-dragging': dragging === index })}
          data-divider={index}
          title="Drag to resize the columns"
          style={{
            left: `${offset * 100}%`,
            top: `${GRIP_INSET * scale}px`,
            bottom: `${GRIP_INSET * scale}px`,
            width: `${GRIP_WIDTH * scale}px`,
          }}
        />
      ))}
    </div>
  )
}
