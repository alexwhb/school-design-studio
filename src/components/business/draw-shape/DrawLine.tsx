/**
 * The line tool: arm it, drag from one point to another, and a straight line is
 * drawn between them.
 *
 * The same line the pen draws with two clicks, made in one drag because that is
 * how every other drawing program draws one, and how the rest of this panel's
 * tools work. Shift holds it to a right angle or a diagonal, Alt draws it out
 * from the middle, and a click with no drag behind it drops a line of a
 * readable length rather than one two pixels long. Both ends are pulled into
 * line with the page, its centre and everything already on it, the same
 * positions a dragged layer snaps to.
 *
 * What it makes is a path, open, with two corner points and nothing on its
 * ends — the arrowheads are a setting in the panel, and the Elements panel
 * carries presets that arrive with them on. Being a path, it can be curved,
 * closed, and given a third point afterwards like any other.
 *
 * Nothing rendered here answers the mouse. The press is taken by a capture-phase
 * listener on the document, for the reason `DrawShape` gives: the board takes
 * presses from a native listener of its own, and a React handler on an overlay
 * would run after it had already decided the press was its own.
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
import { SHAPE_DEFAULT_SIZE, SHAPE_MIN_SIZE } from '@/components/modules/widgets/shape/shapeSetting'
import { fitFrame, type TPathPoint } from '@/components/modules/widgets/wPath/pathGeometry'
import { openPathSetting } from '@/components/modules/widgets/wPath/wPathSetting'
import { SNAP_THRESHOLD, canvasScale, clamp, snap } from './drawGeometry'
import './drawLine.less'

type TPoint = { x: number; y: number }

type TDraft = {
  from: TPoint
  to: TPoint
  guides: { x: number | null; y: number | null }
}

export default function DrawLine() {
  const control = useSnapshot(controlState)
  const canvas = useSnapshot(canvasState)
  const armed = control.dDrawTool === 'line'
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null)
  const [draft, setDraft] = useState<TDraft | null>(null)
  const draftRef = useRef<TDraft | null>(null)
  /** Takes down a line being pulled right now, wherever the tool is let go of. */
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
    // Nothing is being edited while a line is being drawn, and the selection box
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
      const from = { x: snap(origin.x, positions.x, tolerance), y: snap(origin.y, positions.y, tolerance) }
      let dragged = false

      function move(ev: MouseEvent) {
        ev.preventDefault()
        const here = point(ev)
        if (!dragged && Math.hypot(here.x - from.x, here.y - from.y) * scale < 3) return
        dragged = true
        // A line held to an angle is a statement about its direction, which a
        // snap on one end would immediately bend, so the two are never both on.
        let to: TPoint
        let guides = { x: null as number | null, y: null as number | null }
        if (ev.shiftKey) {
          to = straighten(here, from)
        } else {
          to = { x: snap(here.x, positions.x, tolerance), y: snap(here.y, positions.y, tolerance) }
          guides = { x: to.x !== here.x ? to.x : null, y: to.y !== here.y ? to.y : null }
        }
        const start = ev.altKey ? { x: from.x - (to.x - from.x), y: from.y - (to.y - from.y) } : from
        const next = { from: start, to, guides }
        draftRef.current = next
        setDraft(next)
      }

      /** Stops drawing and leaves the page as it was. */
      function cancel() {
        document.removeEventListener('mousemove', move, true)
        document.removeEventListener('mouseup', up, true)
        abandon.current = null
        draftRef.current = null
        setDraft(null)
      }

      function up(ev: MouseEvent) {
        ev.preventDefault()
        ev.stopPropagation()
        const drawn = draftRef.current
        cancel()
        // One line per arming, so what has just been drawn can be styled
        // without the next click on it starting another one on top.
        setDrawTool(null)
        addLine(drawn, from, page)
      }

      abandon.current = cancel
      document.addEventListener('mousemove', move, true)
      document.addEventListener('mouseup', up, true)
    }

    document.addEventListener('mousedown', down, true)
    return () => {
      document.removeEventListener('mousedown', down, true)
      root?.classList.remove('draw-case')
      // Escape mid-drag disarms the tool, which lands here. The line being
      // pulled goes with it rather than finishing itself off on the next mouseup.
      abandon.current?.()
    }
  }, [armed])

  if (!armed) return null

  const scale = 100 / (canvas.dZoom || 100)
  const page = canvas.dPage

  return (
    <>
      <div className="draw-hint" role="status">
        <b>Drag to draw a line.</b> Shift holds it to 45°, Alt draws it from the centre, Esc cancels.
      </div>
      {canvasEl && draft
        ? createPortal(
            <svg className="draw-line" width={page.width} height={page.height} viewBox={`0 0 ${page.width} ${page.height}`}>
              {draft.guides.x !== null ? <line className="draw-line__guide" x1={draft.guides.x} y1={0} x2={draft.guides.x} y2={page.height} strokeWidth={scale} /> : null}
              {draft.guides.y !== null ? <line className="draw-line__guide" x1={0} y1={draft.guides.y} x2={page.width} y2={draft.guides.y} strokeWidth={scale} /> : null}
              <line className="draw-line__line" x1={draft.from.x} y1={draft.from.y} x2={draft.to.x} y2={draft.to.y} strokeWidth={2 * scale} strokeLinecap="round" />
              <text
                className="draw-line__readout"
                x={draft.to.x + 12 * scale}
                y={draft.to.y + 18 * scale}
                fontSize={11 * scale}
              >
                {Math.round(Math.hypot(draft.to.x - draft.from.x, draft.to.y - draft.from.y))}
              </text>
            </svg>,
            canvasEl,
          )
        : null}
    </>
  )
}

/**
 * Held at a right angle or a diagonal from where it started, as far along it
 * as the pointer has reached. Projected rather than turned, so the end stays
 * under the pointer along the direction it is held to. The pen does the same.
 */
function straighten(here: TPoint, from: TPoint): TPoint {
  const dx = here.x - from.x
  const dy = here.y - from.y
  const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
  const along = dx * Math.cos(angle) + dy * Math.sin(angle)
  return { x: from.x + Math.cos(angle) * along, y: from.y + Math.sin(angle) * along }
}

/**
 * Puts the drawn line on the page, or drops a default one where it was clicked.
 *
 * Bracketed by hand because the tool swallows both ends of the gesture: see
 * `beginHistory`. Without it the line appears and Ctrl+Z has nothing to undo.
 */
function addLine(drawn: TDraft | null, origin: TPoint, page: { width: number; height: number }) {
  let points: TPathPoint[]
  if (drawn && Math.hypot(drawn.to.x - drawn.from.x, drawn.to.y - drawn.from.y) >= SHAPE_MIN_SIZE) {
    points = [
      { x: drawn.from.x, y: drawn.from.y },
      { x: drawn.to.x, y: drawn.to.y },
    ]
  } else {
    // A click, so a level line of a readable length centred on it.
    const length = Math.min(SHAPE_DEFAULT_SIZE, page.width)
    const left = clamp(origin.x - length / 2, 0, page.width - length)
    points = [
      { x: left, y: origin.y },
      { x: left + length, y: origin.y },
    ]
  }
  const setting: any = openPathSetting()
  const fitted = fitFrame(points, false, (setting.borderWidth || 0) / 2)
  setting.left = fitted.box.left
  setting.top = fitted.box.top
  setting.width = fitted.box.width
  setting.height = fitted.box.height
  setting.points = fitted.points
  setting.name = 'Line'
  recordHistory(() => addWidget(setting))
}
