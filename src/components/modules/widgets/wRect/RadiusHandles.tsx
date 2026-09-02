/**
 * The corner grips that round a box, the way Adobe XD does it.
 *
 * Four dots sitting just inside the corners of the selected rectangle, dragged
 * along the diagonal: out from the corner to round it, back into the corner to
 * square it off again. Dragging one moves all four, because that is what people
 * want nearly every time; holding Alt moves only the one under the pointer, and
 * doing that once holds the corners apart for good, which is the same state the
 * panel's unlink toggle switches on. A figure follows the grip while it moves,
 * so the radius can be read off without looking away at the panel.
 *
 * They are children of the widget rather than an overlay of their own, so a
 * move, a resize, a rotation or a change of zoom carries them along without
 * anything having to keep them in step — the same arrangement the crop frame
 * uses. What that costs is the canvas's zoom, which is a CSS scale on an
 * ancestor: every length here is divided back out of it so a grip stays the
 * same size to aim at whether the page is at 25% or 200%.
 *
 * The press is taken in the capture phase and stopped there. The board selects
 * and starts moving a layer from a native listener on `#page-design`, and
 * Moveable drags from one on the widget itself; a React handler is delegated to
 * the app root and would run after both had already claimed the press, so the
 * grip would round the corner and drag the whole box at the same time.
 */
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { beginHistory, endHistory } from '@/common/hooks/history'
import { canvasState } from '@/store/state'
import { updateWidgetData } from '@/store/widget/widget'
import type { TdWidgetData } from '@/store/types'
import { CORNERS, isUnlinked, maxRadius, readCorners, type TCorners } from './rectRadius'

/** Screen pixels: the dot itself, and how far a squared-off corner holds it in. */
const GRIP_SIZE = 11
const GRIP_INSET = 15

export default function RadiusHandles({ params }: { params: TdWidgetData }) {
  const p = useSnapshot(params) as any
  const dZoom = useSnapshot(canvasState).dZoom
  const containerRef = useRef<HTMLDivElement | null>(null)
  /** Ends a drag that is still running if the box goes away underneath it. */
  const release = useRef<(() => void) | null>(null)
  const [dragging, setDragging] = useState<{ index: number; value: number } | null>(null)

  const scale = 100 / (dZoom || 100)
  const corners = readCorners(p)
  const limit = maxRadius(p.width, p.height)
  const inset = Math.min(GRIP_INSET * scale, limit)

  // Re-registered each render rather than once, so the handler always closes
  // over the box's current size — the limit a drag is clamped to changes with
  // every resize, and a stale one lets a corner overshoot into a shape CSS then
  // scales back down.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousedown', startDrag, true)
    return () => el.removeEventListener('mousedown', startDrag, true)
  })

  // Deleting the box mid-drag would otherwise leave the document listening for
  // a move that has nothing left to round, and the undo entry never closed.
  useEffect(() => () => release.current?.(), [])

  function apply(index: number, value: number, single: boolean) {
    if (!single) {
      // Back to one number for all four. Clearing `radii` rather than writing
      // four copies is what keeps a design that never unlinked its corners
      // saving exactly as it always did.
      if (isUnlinked(params)) updateWidgetData({ uuid: params.uuid, key: 'radii', value: null })
      updateWidgetData({ uuid: params.uuid, key: 'radius', value })
      return
    }
    const next = readCorners(params) as TCorners
    next[index] = value
    updateWidgetData({ uuid: params.uuid, key: 'radii', value: next })
  }

  function startDrag(e: MouseEvent) {
    const index = Number((e.target as HTMLElement)?.dataset?.corner)
    if (!Number.isInteger(index) || !CORNERS[index]) return
    e.preventDefault()
    e.stopPropagation()

    const corner = CORNERS[index]
    const startValue = readCorners(params)[index]
    const startX = e.pageX
    const startY = e.pageY
    // Decided once, at the press: a modifier that changed what a drag meant
    // half way through it would undo the corners it had already moved.
    const single = e.altKey || isUnlinked(params)
    // The grips are drawn inside a box that may be turned, so the pointer's
    // travel has to be turned back before it can be read as "in from the
    // corner" — otherwise a rounded corner on a tilted box moves the wrong way.
    const angle = ((Number.parseFloat(String(params.rotate || '0')) || 0) * Math.PI) / 180
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    // The press above never reaches the document, and the undo stack is built
    // from presses; see beginHistory.
    beginHistory()

    function move(ev: MouseEvent) {
      ev.preventDefault()
      const zoom = (canvasState.dZoom || 100) / 100
      const screenX = (ev.pageX - startX) / zoom
      const screenY = (ev.pageY - startY) / zoom
      const inX = (screenX * cos - screenY * sin) * (corner.right ? -1 : 1)
      const inY = (screenX * sin + screenY * cos) * (corner.bottom ? -1 : 1)
      // The grip travels the diagonal, and the radius is how far in from the
      // corner that puts it on either axis — which is the mean of the two.
      const value = Math.round(Math.min(Math.max(startValue + (inX + inY) / 2, 0), maxRadius(params.width, params.height)))
      apply(index, value, single)
      setDragging({ index, value })
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

  const readout = dragging ? CORNERS[dragging.index] : null

  return (
    <div className="rect__radius" ref={containerRef}>
      {CORNERS.map((corner, index) => {
        const offset = Math.min(Math.max(corners[index], inset), limit)
        return (
          <div
            key={corner.key}
            className="rect__radius-grip"
            data-corner={index}
            title={`${corner.label} corner — drag to round, Alt to round this corner alone`}
            style={{
              left: corner.right ? `calc(100% - ${offset}px)` : `${offset}px`,
              top: corner.bottom ? `calc(100% - ${offset}px)` : `${offset}px`,
              width: `${GRIP_SIZE * scale}px`,
              height: `${GRIP_SIZE * scale}px`,
              borderWidth: `${Math.max(1, Math.round(scale))}px`,
            }}
          />
        )
      })}
      {readout ? (
        <div
          className="rect__radius-readout"
          style={{
            left: readout.right ? '100%' : '0',
            top: readout.bottom ? '100%' : '0',
            // Read right to left: sized back out of the zoom about the corner
            // it is pinned to, pulled clear of the box, then nudged off the
            // corner so it does not sit under the selection box's own handle.
            transform: `translate(${(readout.right ? 7 : -7) * scale}px, ${(readout.bottom ? 7 : -7) * scale}px) translate(${readout.right ? 0 : -100}%, ${readout.bottom ? 0 : -100}%) scale(${scale})`,
            transformOrigin: `${readout.right ? 0 : 100}% ${readout.bottom ? 0 : 100}%`,
          }}
        >
          {dragging?.value}
        </div>
      ) : null}
    </div>
  )
}
