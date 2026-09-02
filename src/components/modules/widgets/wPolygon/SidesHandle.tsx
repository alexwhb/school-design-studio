/**
 * The grip that adds and removes corners, the way Adobe XD's polygon widget
 * does it.
 *
 * One dot, sitting on the selected polygon between its middle and its right
 * edge, dragged sideways: out to the right for more corners, back to the left
 * for fewer, down to a triangle and up to a hundred. The count follows the
 * pointer as a figure, so the shape can be dialled in without looking away at
 * the panel — which is still there for typing an exact number, and is the
 * quicker way to reach the top of the range.
 *
 * It is a child of the widget rather than an overlay of its own, so a move, a
 * resize, a rotation or a change of zoom carries it along without anything
 * having to keep it in step — the same arrangement the corner grips on a
 * rectangle use, and it costs the same thing: the canvas's zoom is a CSS scale
 * on an ancestor, so every length here is divided back out of it and the grip
 * stays the same size to aim at at any zoom.
 *
 * The press is taken in the capture phase and stopped there. The board selects
 * and starts moving a layer from a native listener on `#page-design`, and
 * Moveable drags from one on the widget itself; a React handler is delegated to
 * the app root and would run after both had already claimed the press, so the
 * grip would change the count and drag the whole shape at the same time.
 */
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { beginHistory, endHistory } from '@/common/hooks/history'
import { canvasState } from '@/store/state'
import { updateWidgetData } from '@/store/widget/widget'
import type { TdWidgetData } from '@/store/types'
import { MAX_SIDES, MIN_SIDES, readSides } from './polygonShape'

/** Screen pixels: the dot itself, and how far one corner is worth dragging. */
const GRIP_SIZE = 11
const PIXELS_PER_SIDE = 6

export default function SidesHandle({ params }: { params: TdWidgetData }) {
  const p = useSnapshot(params) as any
  const dZoom = useSnapshot(canvasState).dZoom
  const containerRef = useRef<HTMLDivElement | null>(null)
  /** Ends a drag that is still running if the shape goes away underneath it. */
  const release = useRef<(() => void) | null>(null)
  const [dragging, setDragging] = useState(false)

  const scale = 100 / (dZoom || 100)
  const sides = readSides(p)

  // Re-registered each render rather than once, so the handler always closes
  // over the count the shape is actually carrying — a drag that started from a
  // stale one would snap the shape back to it on its first move.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousedown', startDrag, true)
    return () => el.removeEventListener('mousedown', startDrag, true)
  })

  // Deleting the shape mid-drag would otherwise leave the document listening
  // for a move that has nothing left to reshape, and the undo entry never
  // closed.
  useEffect(() => () => release.current?.(), [])

  function startDrag(e: MouseEvent) {
    // Present rather than truthy: the attribute is there to mark the grip, and
    // an empty one is what `data-sides` on its own reads back as.
    if ((e.target as HTMLElement)?.dataset?.sides === undefined) return
    e.preventDefault()
    e.stopPropagation()

    const startSides = readSides(params)
    const startX = e.pageX
    const startY = e.pageY
    // The grip is drawn inside a shape that may be turned, so the pointer's
    // travel has to be turned back before it can be read as "out to the right"
    // — otherwise dragging along a tilted shape's own axis does nothing.
    const angle = ((Number.parseFloat(String(params.rotate || '0')) || 0) * Math.PI) / 180
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    // The press above never reaches the document, and the undo stack is built
    // from presses; see beginHistory.
    beginHistory()
    setDragging(true)

    function move(ev: MouseEvent) {
      ev.preventDefault()
      const zoom = (canvasState.dZoom || 100) / 100
      const screenX = (ev.pageX - startX) / zoom
      const screenY = (ev.pageY - startY) / zoom
      const along = screenX * cos - screenY * sin
      const next = Math.min(Math.max(startSides + Math.round(along / PIXELS_PER_SIDE), MIN_SIDES), MAX_SIDES)
      updateWidgetData({ uuid: params.uuid, key: 'sides', value: next })
    }

    function stop() {
      document.removeEventListener('mousemove', move, true)
      document.removeEventListener('mouseup', stop, true)
      release.current = null
      endHistory()
      setDragging(false)
    }

    release.current = stop
    document.addEventListener('mousemove', move, true)
    document.addEventListener('mouseup', stop, true)
  }

  return (
    <div className="polygon__sides" ref={containerRef}>
      {/*
        Three quarters of the way across and half way down, which is on the
        outline of a triangle and inside every shape above one, so the grip
        always reads as belonging to the thing it reshapes.
      */}
      <div
        className="polygon__sides-grip"
        data-sides=""
        title="Drag to add or remove corners"
        style={{
          left: '75%',
          top: '50%',
          width: `${GRIP_SIZE * scale}px`,
          height: `${GRIP_SIZE * scale}px`,
          borderWidth: `${Math.max(1, Math.round(scale))}px`,
        }}
      />
      {dragging ? (
        <div
          className="polygon__sides-readout"
          style={{
            left: '75%',
            top: '50%',
            // Sized back out of the zoom about the grip it is pinned to, then
            // lifted clear of it so the pointer is not sitting on the figure.
            transform: `translate(-50%, ${-14 * scale}px) translateY(-100%) scale(${scale})`,
            transformOrigin: '50% 100%',
          }}
        >
          {sides} sides
        </div>
      ) : null}
    </div>
  )
}
