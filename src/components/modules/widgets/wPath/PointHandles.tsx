/**
 * The grips that reshape a drawn path, the way Adobe XD's point-edit mode does.
 *
 * A dot on every point of the selected path, dragged to move it, with the
 * figure it is being moved to following the pointer so a point can be placed
 * without looking away at the panel. A point that was curved also shows the two
 * control handles that curve it, on stalks, and dragging one swings the other
 * with it — holding Alt breaks that pair, so one side of the point can be
 * steered without the other. Alt-clicking a point, with no drag behind it,
 * turns a corner into a curve and back again, which is XD's convert-point.
 *
 * They are children of the widget rather than an overlay of their own, so a
 * move, a resize, a rotation or a change of zoom carries them along without
 * anything having to keep them in step — the same arrangement the box's corner
 * grips use. What that costs is the canvas's zoom, which is a CSS scale on an
 * ancestor: every length here is divided back out of it so a grip stays the
 * same size to aim at whether the page is at 25% or 200%.
 *
 * A point dragged past the widget's edge is still drawn — nothing here or in
 * the paint is clipped — but the frame is then no longer the shape's bounds,
 * and everything that reads it, from the selection box to snapping, is out by
 * however far the point went. So the frame is fitted back round the path when
 * the drag ends, which is also when XD's bounding box catches up.
 *
 * The press is taken in the capture phase and stopped there. The board selects
 * and starts moving a layer from a native listener on `#page-design`, and
 * Moveable drags from one on the widget itself; a React handler is delegated to
 * the app root and would run after both had already claimed the press, so the
 * grip would move the point and drag the whole path at the same time.
 */
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { beginHistory, endHistory } from '@/common/hooks/history'
import { canvasState } from '@/store/state'
import { updateWidgetData } from '@/store/widget/widget'
import type { TdWidgetData } from '@/store/types'
import { widgetBorder } from '../widgetBorder'
import { endsPad } from './lineEnds'
import {
  clonePoints,
  isClosed,
  paintBox,
  pathD,
  readPoints,
  refitFrame,
  smoothHandles,
  type TPathHandle,
  type TPathPoint,
} from './pathGeometry'

/** Screen pixels: the point itself, and the smaller dot on the end of a stalk. */
const POINT_SIZE = 10
const HANDLE_SIZE = 8

/** How far a press has to travel before it is a drag rather than a click. */
const DRAG_SLOP = 3

type Dragging = { kind: 'point' | 'handle'; index: number; x: number; y: number }

export default function PointHandles({ params }: { params: TdWidgetData }) {
  const p = useSnapshot(params) as any
  const dZoom = useSnapshot(canvasState).dZoom
  const containerRef = useRef<HTMLDivElement | null>(null)
  /** Ends a drag that is still running if the path goes away underneath it. */
  const release = useRef<(() => void) | null>(null)
  const [dragging, setDragging] = useState<Dragging | null>(null)

  const scale = 100 / (dZoom || 100)
  const points = readPoints(p)
  const closed = isClosed(p)
  const stroke = widgetBorder(p)?.width || 0
  const box = paintBox(p.width, p.height, stroke, endsPad(p))

  // Re-registered each render rather than once, so the handler always closes
  // over the path's current size and points: both change under it, and a stale
  // reading would move the point that was there when the grips first drew.
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('mousedown', startDrag, true)
    return () => el.removeEventListener('mousedown', startDrag, true)
  })

  // Deleting the path mid-drag would otherwise leave the document listening for
  // a move that has nothing left to reshape, and the undo entry never closed.
  useEffect(() => () => release.current?.(), [])

  function write(next: TPathPoint[]) {
    updateWidgetData({ uuid: params.uuid, key: 'points', value: next })
  }

  /** Puts the frame back round the path once a point has stopped moving. */
  function refit() {
    // A turned path is drawn about its own centre, so moving its frame moves the
    // artwork as well as the box round it. Left alone rather than left wrong.
    if (params.rotate) return
    const width = widgetBorder(params)?.width || 0
    const frame = { left: params.left, top: params.top, width: params.width, height: params.height }
    const fitted = refitFrame(readPoints(params), isClosed(params), frame, width, endsPad(params))
    if (!fitted) return
    updateWidgetData({ uuid: params.uuid, key: 'points', value: fitted.points })
    updateWidgetData({ uuid: params.uuid, key: 'left', value: fitted.box.left })
    updateWidgetData({ uuid: params.uuid, key: 'top', value: fitted.box.top })
    updateWidgetData({ uuid: params.uuid, key: 'width', value: fitted.box.width })
    updateWidgetData({ uuid: params.uuid, key: 'height', value: fitted.box.height })
  }

  function startDrag(e: MouseEvent) {
    const data = (e.target as HTMLElement)?.dataset
    const index = Number(data?.point ?? data?.handle)
    const side = data?.side as 'in' | 'out' | undefined
    const held = readPoints(params)
    if (!Number.isInteger(index) || !held[index]) return
    e.preventDefault()
    e.stopPropagation()

    const startX = e.pageX
    const startY = e.pageY
    const start = held[index]
    const startHandle = side ? start[side] : undefined
    // Decided once, at the press: a modifier that changed what a drag meant half
    // way through would undo the moving it had already done.
    const alt = e.altKey
    // Mirrored only while the two handles already answer each other. Once a
    // point has been broken it stays broken, the way it does in XD.
    const mirrored = !!(start.in && start.out && Math.abs(start.in.x + start.out.x) < 1e-6 && Math.abs(start.in.y + start.out.y) < 1e-6)
    // The grips are drawn inside a frame that may be turned, so the pointer's
    // travel has to be turned back before it can be read as a distance across
    // the path — otherwise a point on a tilted shape follows the wrong way.
    const angle = ((Number.parseFloat(String(params.rotate || '0')) || 0) * Math.PI) / 180
    const cos = Math.cos(-angle)
    const sin = Math.sin(-angle)
    let moved = false
    // The press above never reaches the document, and the undo stack is built
    // from presses; see beginHistory.
    beginHistory()

    function move(ev: MouseEvent) {
      ev.preventDefault()
      const zoom = (canvasState.dZoom || 100) / 100
      const travelX = (ev.pageX - startX) / zoom
      const travelY = (ev.pageY - startY) / zoom
      if (!moved && Math.hypot(travelX, travelY) * zoom < DRAG_SLOP) return
      moved = true

      const width = widgetBorder(params)?.width || 0
      const area = paintBox(params.width, params.height, width, endsPad(params))
      // Design pixels of travel, turned back out of the widget's rotation and
      // then read as a fraction of the box the points are measured in.
      const dx = (travelX * cos - travelY * sin) / (area.width || 1)
      const dy = (travelX * sin + travelY * cos) / (area.height || 1)

      const next = clonePoints(readPoints(params))
      const point = next[index]
      if (!point) return
      if (!side) {
        point.x = start.x + dx
        point.y = start.y + dy
      } else {
        const pulled: TPathHandle = { x: (startHandle?.x ?? 0) + dx, y: (startHandle?.y ?? 0) + dy }
        point[side] = pulled
        if (mirrored && !alt) point[side === 'in' ? 'out' : 'in'] = { x: -pulled.x, y: -pulled.y }
      }
      write(next)
      const shown = side ? point[side]! : point
      setDragging({
        kind: side ? 'handle' : 'point',
        index,
        x: Math.round(params.left + area.x + (side ? point.x + shown.x : shown.x) * area.width),
        y: Math.round(params.top + area.y + (side ? point.y + shown.y : shown.y) * area.height),
      })
    }

    function stop() {
      document.removeEventListener('mousemove', move, true)
      document.removeEventListener('mouseup', stop, true)
      release.current = null
      // A press with no travel behind it was a click, and Alt makes it XD's
      // convert-point: a corner takes handles, a curve gives them up.
      if (!moved && alt && !side) convert(index)
      if (moved) refit()
      endHistory()
      setDragging(null)
    }

    release.current = stop
    document.addEventListener('mousemove', move, true)
    document.addEventListener('mouseup', stop, true)
  }

  function convert(index: number) {
    const next = clonePoints(readPoints(params))
    const point = next[index]
    if (!point) return
    if (point.in || point.out) {
      delete point.in
      delete point.out
    } else {
      const smooth = smoothHandles(next, index, isClosed(params))
      if (smooth.in) point.in = smooth.in
      if (smooth.out) point.out = smooth.out
    }
    write(next)
  }

  function at(point: TPathPoint) {
    return { left: `${box.x + point.x * box.width}px`, top: `${box.y + point.y * box.height}px` }
  }

  const stalks = points.flatMap((point, index) =>
    (['in', 'out'] as const)
      .filter((side) => point[side])
      .map((side) => ({ index, side, handle: point[side]! })),
  )

  return (
    <div className="path__points" ref={containerRef}>
      {/*
        The stalks are drawn rather than laid out, because each is a line between
        two moving points and CSS has no way to say that. Nothing here answers
        the mouse; the dots on the ends do, and they are elements above it.
      */}
      <svg className="path__points-stalks" width={p.width} height={p.height} viewBox={`0 0 ${p.width} ${p.height}`}>
        {/* The path itself, thin and in the selection colour, so a curve dragged out of the frame can still be seen. */}
        <path className="path__points-outline" d={pathD(points, closed, box)} fill="none" strokeWidth={scale} />
        {stalks.map(({ index, side, handle }) => {
          const point = points[index]
          return (
            <line
              key={`${index}-${side}`}
              className="path__points-stalk"
              x1={box.x + point.x * box.width}
              y1={box.y + point.y * box.height}
              x2={box.x + (point.x + handle.x) * box.width}
              y2={box.y + (point.y + handle.y) * box.height}
              strokeWidth={scale}
            />
          )
        })}
      </svg>
      {points.map((point, index) => (
        <div
          key={`point-${index}`}
          className="path__point"
          data-point={index}
          title="Drag to move this point, Alt-click to curve or square it off"
          style={{ ...at(point), width: `${POINT_SIZE * scale}px`, height: `${POINT_SIZE * scale}px`, borderWidth: `${Math.max(1, Math.round(scale))}px` }}
        />
      ))}
      {stalks.map(({ index, side, handle }) => {
        const point = points[index]
        return (
          <div
            key={`handle-${index}-${side}`}
            className="path__handle"
            data-handle={index}
            data-side={side}
            title="Drag to bend the curve, Alt to bend this side alone"
            style={{
              ...at({ x: point.x + handle.x, y: point.y + handle.y }),
              width: `${HANDLE_SIZE * scale}px`,
              height: `${HANDLE_SIZE * scale}px`,
              borderWidth: `${Math.max(1, Math.round(scale))}px`,
            }}
          />
        )
      })}
      {dragging ? (
        <div
          className="path__readout"
          style={{
            ...at(points[dragging.index] ?? { x: 0, y: 0 }),
            transform: `translate(${10 * scale}px, ${-10 * scale}px) translateY(-100%) scale(${scale})`,
            transformOrigin: 'left bottom',
          }}
        >
          {dragging.x}, {dragging.y}
        </div>
      ) : null}
    </div>
  )
}
