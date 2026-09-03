/**
 * The line tool: arm it, and draw a straight line between two points on the page.
 *
 * Two gestures, the way Adobe XD's line tool has two. Drag from one point to
 * the other and let go, or click once to put the start down, move, and click
 * again to finish — a rubber line follows the pointer in between, and Escape
 * leaves the page as it was. A press that goes nowhere is the start of the
 * second gesture rather than a line of its own, which is what it used to drop.
 * Shift holds the line to a right angle or a diagonal, Alt draws it out from
 * the middle, and both ends are pulled into line with the page, its centre and
 * everything already on it, the same positions a dragged layer snaps to.
 *
 * What it makes is a path, open, with two corner points. Bare from the dock;
 * wearing a preset's arrowheads and dash when the tool was armed from the
 * Arrows row of the Graphics panel, which arms this tool rather than dropping a
 * ready-made line in the middle of the page. Being a path it can be curved,
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
import { SHAPE_MIN_SIZE } from '@/components/modules/widgets/shape/shapeSetting'
import { fitFrame, type TPathPoint } from '@/components/modules/widgets/wPath/pathGeometry'
import { endsPad } from '@/components/modules/widgets/wPath/lineEnds'
import { applyLinePreset, findLinePreset } from '@/components/modules/widgets/wPath/linePresets'
import { openPathSetting } from '@/components/modules/widgets/wPath/wPathSetting'
import { SNAP_THRESHOLD, canvasScale, clamp, snap } from './drawGeometry'
import './drawLine.less'

type TPoint = { x: number; y: number }

type TDraft = {
  from: TPoint
  to: TPoint
  guides: { x: number | null; y: number | null }
}

/**
 * The page as the gesture found it: where it is on screen, what it is scaled
 * to, and everything a point can be pulled into line with. Measured once when
 * the line is started and kept for as long as it is being drawn, so a line
 * clicked out over several seconds snaps to the same positions throughout.
 */
type TGround = {
  scale: number
  positions: { x: number[]; y: number[] }
  tolerance: number
  point: (ev: MouseEvent) => TPoint
}

export default function DrawLine() {
  const control = useSnapshot(controlState)
  const canvas = useSnapshot(canvasState)
  const armed = control.dDrawTool === 'line'
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null)
  const [draft, setDraft] = useState<TDraft | null>(null)
  const draftRef = useRef<TDraft | null>(null)
  /** Takes down a line being drawn right now, wherever the tool is let go of. */
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

    /** A line whose start is down and whose end the next click will place. */
    let pending: { from: TPoint; ground: TGround } | null = null
    /** Lets go of the listeners a press in progress put up. */
    let release: (() => void) | null = null

    function survey(canvas: HTMLElement): TGround {
      const page = canvasState.dPage
      const rect = canvas.getBoundingClientRect()
      const scale = canvasScale(canvas)
      return {
        scale,
        positions: getSnapPositions(widgetState.dWidgets, page, { guides: canvasState.guidelines }),
        tolerance: SNAP_THRESHOLD / scale,
        point: (ev: MouseEvent) => ({
          x: clamp((ev.clientX - rect.left) / scale, 0, page.width),
          y: clamp((ev.clientY - rect.top) / scale, 0, page.height),
        }),
      }
    }

    /** Where the far end of a line out of `from` lands, with the keys taken into account. */
    function track(ev: MouseEvent, from: TPoint, ground: TGround): TDraft {
      const here = ground.point(ev)
      // A line held to an angle is a statement about its direction, which a
      // snap on one end would immediately bend, so the two are never both on.
      let to: TPoint
      let guides = { x: null as number | null, y: null as number | null }
      if (ev.shiftKey) {
        to = straighten(here, from)
      } else {
        to = { x: snap(here.x, ground.positions.x, ground.tolerance), y: snap(here.y, ground.positions.y, ground.tolerance) }
        guides = { x: to.x !== here.x ? to.x : null, y: to.y !== here.y ? to.y : null }
      }
      const start = ev.altKey ? { x: from.x - (to.x - from.x), y: from.y - (to.y - from.y) } : from
      return { from: start, to, guides }
    }

    function show(next: TDraft) {
      draftRef.current = next
      setDraft(next)
    }

    /** The rubber line between a placed start and the pointer, no button held. */
    function hover(ev: MouseEvent) {
      if (pending) show(track(ev, pending.from, pending.ground))
    }

    /** Stops drawing and leaves the page as it was. */
    function cancel() {
      release?.()
      release = null
      document.removeEventListener('mousemove', hover, true)
      pending = null
      abandon.current = null
      draftRef.current = null
      setDraft(null)
    }

    function down(e: MouseEvent) {
      // Holding space is a request to pan the board, which outranks the tool.
      if (e.button !== 0 || controlState.dSpaceDown) return
      const canvas = document.getElementById('page-design-canvas')
      const board = document.getElementById('page-design')
      if (!canvas || !board || !board.contains(e.target as Node)) return
      e.preventDefault()
      e.stopPropagation()

      // The second press of a line clicked out: the start is already down, so
      // this press only carries the far end, and letting go of it finishes.
      const started = pending
      document.removeEventListener('mousemove', hover, true)
      const ground = started ? started.ground : survey(canvas)
      const origin = ground.point(e)
      const from = started
        ? started.from
        : { x: snap(origin.x, ground.positions.x, ground.tolerance), y: snap(origin.y, ground.positions.y, ground.tolerance) }
      let dragged = !!started
      if (started) show(track(e, from, ground))

      function move(ev: MouseEvent) {
        ev.preventDefault()
        const here = ground.point(ev)
        if (!dragged && Math.hypot(here.x - from.x, here.y - from.y) * ground.scale < 3) return
        dragged = true
        show(track(ev, from, ground))
      }

      function up(ev: MouseEvent) {
        ev.preventDefault()
        ev.stopPropagation()
        release?.()
        release = null
        const drawn = draftRef.current
        if (dragged && drawn && length(drawn) >= SHAPE_MIN_SIZE) {
          cancel()
          // Read before the tool is put down, which is what clears it.
          const preset = controlState.dLinePreset
          // One line per arming, so what has just been drawn can be styled
          // without the next click on it starting another one on top.
          setDrawTool(null)
          addLine(drawn, preset)
          return
        }
        // Nothing long enough to be a line, so the press put the start down and
        // the next click places the end. Everything measured for this press is
        // kept, including the tool being armed: it has drawn nothing yet.
        pending = { from, ground }
        show(track(ev, from, ground))
        document.addEventListener('mousemove', hover, true)
        abandon.current = cancel
      }

      release = () => {
        document.removeEventListener('mousemove', move, true)
        document.removeEventListener('mouseup', up, true)
      }
      abandon.current = cancel
      document.addEventListener('mousemove', move, true)
      document.addEventListener('mouseup', up, true)
    }

    document.addEventListener('mousedown', down, true)
    return () => {
      document.removeEventListener('mousedown', down, true)
      root?.classList.remove('draw-case')
      // Escape mid-line disarms the tool, which lands here. The line being drawn
      // goes with it rather than finishing itself off on the next mouseup.
      abandon.current?.()
    }
  }, [armed])

  if (!armed) return null

  const scale = 100 / (canvas.dZoom || 100)
  const page = canvas.dPage
  // A start that has been put down but not yet drawn away from. There is no
  // line to draw and no length to say, and a readout of 0 beside the pointer
  // says nothing the pointer does not.
  const empty = !!draft && draft.from.x === draft.to.x && draft.from.y === draft.to.y

  return (
    <>
      {canvasEl && draft
        ? createPortal(
            <svg className="draw-line" width={page.width} height={page.height} viewBox={`0 0 ${page.width} ${page.height}`}>
              {draft.guides.x !== null ? <line className="draw-line__guide" x1={draft.guides.x} y1={0} x2={draft.guides.x} y2={page.height} strokeWidth={scale} /> : null}
              {draft.guides.y !== null ? <line className="draw-line__guide" x1={0} y1={draft.guides.y} x2={page.width} y2={draft.guides.y} strokeWidth={scale} /> : null}
              <line className="draw-line__line" x1={draft.from.x} y1={draft.from.y} x2={draft.to.x} y2={draft.to.y} strokeWidth={2 * scale} strokeLinecap="round" />
              {empty ? null : (
                <text
                  className="draw-line__readout"
                  x={draft.to.x + 12 * scale}
                  y={draft.to.y + 18 * scale}
                  fontSize={11 * scale}
                >
                  {Math.round(length(draft))}
                </text>
              )}
            </svg>,
            canvasEl,
          )
        : null}
    </>
  )
}

/** How long the line is, in design pixels. */
function length(draft: TDraft): number {
  return Math.hypot(draft.to.x - draft.from.x, draft.to.y - draft.from.y)
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
 * Puts the drawn line on the page, wearing whatever preset the tool was armed
 * with. The frame is fitted round the heads as well as the stroke, because a
 * head is wider than the line it sits on and a frame round the line alone would
 * cut it off along a straight edge.
 *
 * Bracketed by hand because the tool swallows both ends of the gesture: see
 * `beginHistory`. Without it the line appears and Ctrl+Z has nothing to undo.
 */
function addLine(drawn: TDraft, presetName: string | null) {
  const setting: any = openPathSetting()
  const preset = findLinePreset(presetName)
  if (preset) applyLinePreset(setting, preset)
  else setting.name = 'Line'

  const points: TPathPoint[] = [
    { x: drawn.from.x, y: drawn.from.y },
    { x: drawn.to.x, y: drawn.to.y },
  ]
  const fitted = fitFrame(points, false, (setting.borderWidth || 0) / 2 + endsPad(setting))
  setting.left = fitted.box.left
  setting.top = fitted.box.top
  setting.width = fitted.box.width
  setting.height = fitted.box.height
  setting.points = fitted.points
  recordHistory(() => addWidget(setting))
}
