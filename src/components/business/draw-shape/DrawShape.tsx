/**
 * The shape tools: arm one, drag anywhere on the page, and a rectangle, an
 * ellipse or a polygon is drawn at whatever size you pulled it out to.
 *
 * Adobe XD's shape tools, and the same three habits — Shift
 * holds the two sides equal, Alt grows the shape out of the point you started
 * from rather than towards you, and a click with no drag behind it drops one at
 * a readable default size instead of a shape four pixels wide. Edges are pulled
 * into line with the page, its centre and everything already on it, the same
 * positions a dragged layer snaps to, so a shape drawn by hand lands where a
 * shape moved by hand would.
 *
 * They are one gesture with several outcomes, so they are one component: what
 * the shape is called, what it is drawn from and what the rubber band looks
 * like is all `drawTools` knows, and the drag itself never asks which is armed.
 *
 * Nothing rendered here answers the mouse. The press is taken by a capture-phase
 * listener on the document, because the board selects and starts moving layers
 * from a native listener on `#page-design` and the drag-select box listens on
 * the same element: a React handler on an overlay is delegated to the app root
 * and would run after both had already decided the press was theirs. The
 * markup is only what you see — the rubber band and its size, drawn inside the
 * page so it scales with it, and a line of instructions that does not.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSnapshot } from 'valtio'
import { recordHistory } from '@/common/hooks/history'
import getSnapPositions from '@/common/methods/snapping'
import { getAppRoot } from '@/common/hooks/appRoot'
import { canvasState, controlState, widgetState } from '@/store/state'
import { setDrawTool } from '@/store/control'
import { addWidget } from '@/store/widget'
import { clearSelection } from '@/store/widget/select'
import { cx } from '@/utils/dom'
import { SHAPE_DEFAULT_SIZE, SHAPE_MIN_SIZE } from '@/components/modules/widgets/shape/shapeSetting'
import type { TDrawTool } from '@/store/types'
import { drawTools } from './drawTools'
import './drawShape.less'

/** How close an edge has to come, in screen pixels, before it is pulled into line. */
const SNAP_THRESHOLD = 5

type TBox = { left: number; top: number; width: number; height: number }

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), Math.max(low, high))
}

/**
 * The canvas's own scale, measured rather than read off the zoom: the two agree
 * everywhere except for the instant between a zoom being set and the page being
 * drawn at it, and a shape started in that instant would come out the wrong size.
 */
function canvasScale(el: HTMLElement) {
  return el.getBoundingClientRect().width / el.offsetWidth || 1
}

/** The nearest position within `tolerance`, or the value untouched. */
function snap(value: number, positions: number[], tolerance: number) {
  let best = value
  let bestDistance = tolerance
  for (const position of positions) {
    const distance = Math.abs(position - value)
    if (distance < bestDistance) {
      bestDistance = distance
      best = position
    }
  }
  return best
}

export default function DrawShape() {
  const control = useSnapshot(controlState)
  const canvas = useSnapshot(canvasState)
  const tool = control.dDrawTool
  const armed = !!tool
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null)
  const [band, setBand] = useState<TBox | null>(null)
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const bandRef = useRef<TBox | null>(null)
  /** Takes down a shape being pulled right now, wherever the tool is let go of. */
  const abandon = useRef<(() => void) | null>(null)

  useEffect(() => {
    const root = getAppRoot()
    if (!armed) {
      root?.classList.remove('draw-case')
      setCanvasEl(null)
      return
    }

    root?.classList.add('draw-case')
    setCanvasEl(document.getElementById('page-design-canvas'))
    // Nothing is being edited while a shape is being drawn, and the selection box
    // would otherwise sit over the page taking presses meant for the tool.
    clearSelection()

    function down(e: MouseEvent) {
      // Holding space is a request to pan the board, which outranks the tool.
      if (e.button !== 0 || controlState.dSpaceDown) return
      const canvas = document.getElementById('page-design-canvas')
      const board = document.getElementById('page-design')
      if (!canvas || !board || !board.contains(e.target as Node)) return
      e.preventDefault()
      e.stopPropagation()

      const page = canvasState.dPage
      const rect = canvas.getBoundingClientRect()
      const scale = canvasScale(canvas)
      const positions = getSnapPositions(widgetState.dWidgets, page, { guides: canvasState.guidelines })
      const tolerance = SNAP_THRESHOLD / scale

      const point = (ev: MouseEvent) => ({
        x: clamp((ev.clientX - rect.left) / scale, 0, page.width),
        y: clamp((ev.clientY - rect.top) / scale, 0, page.height),
      })

      const origin = point(e)
      const snappedOrigin = { x: snap(origin.x, positions.x, tolerance), y: snap(origin.y, positions.y, tolerance) }

      function move(ev: MouseEvent) {
        ev.preventDefault()
        const here = point(ev)
        // A square is a statement about the two sides being equal, which a snap
        // would immediately undo, so the two are never both on.
        const square = ev.shiftKey
        const from = square ? origin : snappedOrigin
        const to = square ? here : { x: snap(here.x, positions.x, tolerance), y: snap(here.y, positions.y, tolerance) }

        let dx = to.x - from.x
        let dy = to.y - from.y
        if (square) {
          const side = Math.max(Math.abs(dx), Math.abs(dy))
          dx = dx < 0 ? -side : side
          dy = dy < 0 ? -side : side
        }

        const box = ev.altKey
          ? { left: from.x - Math.abs(dx), top: from.y - Math.abs(dy), width: Math.abs(dx) * 2, height: Math.abs(dy) * 2 }
          : { left: Math.min(from.x, from.x + dx), top: Math.min(from.y, from.y + dy), width: Math.abs(dx), height: Math.abs(dy) }

        const left = clamp(box.left, 0, page.width)
        const top = clamp(box.top, 0, page.height)
        const next = {
          left,
          top,
          width: clamp(box.width - (left - box.left), 0, page.width - left),
          height: clamp(box.height - (top - box.top), 0, page.height - top),
        }
        bandRef.current = next
        setBand(next)
        setGuides({
          x: !square && to.x !== here.x ? to.x : null,
          y: !square && to.y !== here.y ? to.y : null,
        })
      }

      /** Stops drawing and leaves the page as it was. */
      function cancel() {
        document.removeEventListener('mousemove', move, true)
        document.removeEventListener('mouseup', up, true)
        abandon.current = null
        bandRef.current = null
        setBand(null)
        setGuides({ x: null, y: null })
      }

      function up(ev: MouseEvent) {
        ev.preventDefault()
        ev.stopPropagation()
        const drawn = bandRef.current
        cancel()
        // One shape per arming, so what has just been drawn can be styled
        // without the next click on it starting another one on top.
        setDrawTool(null)
        addShape(tool!, drawn, snappedOrigin, page)
      }

      abandon.current = cancel
      document.addEventListener('mousemove', move, true)
      document.addEventListener('mouseup', up, true)
    }

    document.addEventListener('mousedown', down, true)
    return () => {
      document.removeEventListener('mousedown', down, true)
      root?.classList.remove('draw-case')
      // Escape mid-drag disarms the tool, which lands here. The shape being
      // pulled goes with it rather than finishing itself off on the next mouseup.
      abandon.current?.()
    }
    // On the tool rather than on `armed`, so swapping one for the other rebuilds
    // the listener around the shape that is now armed.
  }, [tool])

  if (!tool) return null

  const scale = 100 / (canvas.dZoom || 100)
  const page = canvas.dPage
  const below = band ? band.top + band.height + 24 * scale <= page.height : true

  return (
    <>
      <div className="draw-hint" role="status">
        <b>Drag to draw {drawTools[tool].noun}.</b> Shift keeps it {drawTools[tool].equal}, Alt draws it from the centre, Esc cancels.
      </div>
      {canvasEl && band
        ? createPortal(
            <div className="draw-band__wrap">
              {guides.x !== null ? <i className="draw-guide draw-guide--v" style={{ left: `${guides.x}px`, width: `${scale}px` }} /> : null}
              {guides.y !== null ? <i className="draw-guide draw-guide--h" style={{ top: `${guides.y}px`, height: `${scale}px` }} /> : null}
              <div
                className={cx('draw-band', { 'draw-band--round': drawTools[tool].round })}
                style={{
                  left: `${band.left}px`,
                  top: `${band.top}px`,
                  width: `${band.width}px`,
                  height: `${band.height}px`,
                  borderWidth: `${scale}px`,
                }}
              >
                <span
                  className="draw-band__size"
                  style={{
                    // Under the box, and flipped above it when the box has been
                    // drawn hard against the bottom of the page.
                    top: below ? '100%' : 'auto',
                    bottom: below ? 'auto' : '100%',
                    transform: `scale(${scale})`,
                    transformOrigin: below ? 'left top' : 'left bottom',
                  }}
                >
                  {Math.round(band.width)} × {Math.round(band.height)}
                </span>
              </div>
            </div>,
            canvasEl,
          )
        : null}
    </>
  )
}

/**
 * Puts the drawn shape on the page, or drops a default one where it was clicked.
 *
 * Bracketed by hand because the tool swallows both ends of the gesture: see
 * `beginHistory`. Without it the shape appears and Ctrl+Z has nothing to undo.
 */
function addShape(tool: TDrawTool, drawn: TBox | null, origin: { x: number; y: number }, page: { width: number; height: number }) {
  const setting = JSON.parse(JSON.stringify(drawTools[tool].setting))
  if (drawn && drawn.width >= SHAPE_MIN_SIZE && drawn.height >= SHAPE_MIN_SIZE) {
    setting.left = Math.round(drawn.left)
    setting.top = Math.round(drawn.top)
    setting.width = Math.round(drawn.width)
    setting.height = Math.round(drawn.height)
  } else {
    const size = Math.min(SHAPE_DEFAULT_SIZE, page.width, page.height)
    setting.width = size
    setting.height = size
    setting.left = Math.round(clamp(origin.x - size / 2, 0, page.width - size))
    setting.top = Math.round(clamp(origin.y - size / 2, 0, page.height - size))
  }
  recordHistory(() => addWidget(setting))
}
