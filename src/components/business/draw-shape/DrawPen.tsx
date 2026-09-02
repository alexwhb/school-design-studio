/**
 * The pen tool: arm it, then click a point at a time and a path is drawn
 * through them.
 *
 * Adobe XD's pen, and the same habits. A click puts down a corner. A click held
 * and dragged puts down a curve instead, pulling a pair of control handles out
 * of the point as you go, so the line arrives and leaves along the direction
 * you pulled — Alt while pulling leaves the incoming side square, which is the
 * cusp you want where a curve meets a straight run. Shift holds the next point
 * at a right angle or a diagonal from the last one. Points are pulled into line
 * with the page, its centre and everything already on it, the same positions a
 * dragged layer snaps to.
 *
 * How you stop is what you get, which is the whole of the difference between
 * the two shapes this tool makes. Click the point you started from and the path
 * runs back to it: a closed shape, filled the same placeholder grey a box or an
 * ellipse arrives in. Stop anywhere else — Enter, Escape, or a click on the
 * point you finished on — and it stays open: a line, with an outline to be a
 * line with and nothing inside it. Both are the same widget, and the panel
 * moves one between the two.
 *
 * Escape ends the path rather than throwing it away, because that is what it
 * does in XD and in every other pen worth the name; the drawing is one entry on
 * the undo stack, so Ctrl+Z is how you take it back. That is the one place this
 * tool parts company with the rectangle and ellipse tools, where Escape is a
 * cancel — a drag has one point and nothing to lose, a path has as many as you
 * have placed.
 *
 * Nothing rendered here answers the mouse. The presses are taken by
 * capture-phase listeners on the document, because the board selects and starts
 * moving layers from a native listener on `#page-design` and the drag-select box
 * listens on the same element: a React handler on an overlay is delegated to the
 * app root and would run after both had already decided the press was theirs.
 * Escape and Enter are taken in the capture phase for the same reason — the
 * editor's own shortcut handler is on the bubble, and its Escape would disarm
 * the tool out from under a path that had not been put on the page yet.
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
import { fitFrame, pathD, type TPathPoint } from '@/components/modules/widgets/wPath/pathGeometry'
import { closedPathSetting, openPathSetting } from '@/components/modules/widgets/wPath/wPathSetting'
import { SNAP_THRESHOLD, canvasScale, clamp, snap } from './drawGeometry'
import './drawPen.less'

/** How near the point you started from a click has to land to close the path, in screen pixels. */
const CLOSE_RADIUS = 10

/** How far a press has to travel before it is pulling a curve rather than placing a corner. */
const PULL_SLOP = 3

/** The preview is drawn in page coordinates, which is what the points are already in. */
const PAGE_BOX = { x: 0, y: 0, width: 1, height: 1 }

type TPoint = { x: number; y: number }

type TDraft = {
  points: TPathPoint[]
  /** Where the next point would go, for the length of line that follows the pointer. */
  cursor: TPoint | null
  /** True while a click would close the path rather than add to it. */
  closing: boolean
  guides: { x: number | null; y: number | null }
}

const EMPTY: TDraft = { points: [], cursor: null, closing: false, guides: { x: null, y: null } }

export default function DrawPen() {
  const control = useSnapshot(controlState)
  const canvas = useSnapshot(canvasState)
  const armed = control.dDrawTool === 'pen'
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null)
  const [draft, setDraft] = useState<TDraft>(EMPTY)
  const draftRef = useRef<TDraft>(EMPTY)

  useEffect(() => {
    const root = getAppRoot()
    if (!armed) {
      root?.classList.remove('draw-case')
      setCanvasEl(null)
      return
    }

    root?.classList.add('draw-case')
    setCanvasEl(document.getElementById('page-design-canvas'))
    // Nothing is being edited while a path is being drawn, and the selection box
    // would otherwise sit over the page taking presses meant for the tool.
    clearSelection()

    /** True once the path has been put on the page, so nothing puts it there twice. */
    let done = false
    let pulling: (() => void) | null = null

    function set(next: Partial<TDraft>) {
      draftRef.current = { ...draftRef.current, ...next }
      setDraft(draftRef.current)
    }

    /**
     * What every point of one path is pulled into line with. Worked out once and
     * kept, because it is a walk over every layer on the page and the pointer
     * asks for it on every move — and because nothing can join the page while
     * the pen has it.
     */
    let snapPositions: { x: number[]; y: number[] } | null = null

    /** Where the page is on screen, and how far a screen pixel goes on it. */
    function stage() {
      const el = document.getElementById('page-design-canvas')
      if (!el) return null
      const scale = canvasScale(el)
      const rect = el.getBoundingClientRect()
      const page = canvasState.dPage
      if (!snapPositions) snapPositions = getSnapPositions(widgetState.dWidgets, page, { guides: canvasState.guidelines })
      return {
        scale,
        page,
        positions: snapPositions,
        at: (ev: MouseEvent) => ({
          x: clamp((ev.clientX - rect.left) / scale, 0, page.width),
          y: clamp((ev.clientY - rect.top) / scale, 0, page.height),
        }),
      }
    }

    /**
     * Held at a right angle or a diagonal from the point before, as far along it
     * as the pointer has reached. Projected rather than turned, so the point
     * stays under the pointer along the direction it is held to.
     */
    function straighten(here: TPoint, from: TPoint): TPoint {
      const dx = here.x - from.x
      const dy = here.y - from.y
      const angle = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4)
      const along = dx * Math.cos(angle) + dy * Math.sin(angle)
      return { x: from.x + Math.cos(angle) * along, y: from.y + Math.sin(angle) * along }
    }

    /** Within a grip's reach of the first point, which is where a click closes the path. */
    function closesAt(here: TPoint, scale: number) {
      const points = draftRef.current.points
      if (points.length < 2) return false
      return Math.hypot(here.x - points[0].x, here.y - points[0].y) * scale <= CLOSE_RADIUS
    }

    function endsAt(here: TPoint, scale: number) {
      const points = draftRef.current.points
      if (points.length < 2) return false
      const last = points[points.length - 1]
      return Math.hypot(here.x - last.x, here.y - last.y) * scale <= CLOSE_RADIUS
    }

    /**
     * Where the next point would land: pulled into line with what is on the page,
     * or held to a diagonal from the last point, which are two answers to the
     * same question and never both given.
     */
    function place(here: TPoint, ev: MouseEvent, scale: number, positions: { x: number[]; y: number[] }) {
      const points = draftRef.current.points
      if (ev.shiftKey && points.length) return { point: straighten(here, points[points.length - 1]), guides: { x: null, y: null } }
      const tolerance = SNAP_THRESHOLD / scale
      const point = { x: snap(here.x, positions.x, tolerance), y: snap(here.y, positions.y, tolerance) }
      return { point, guides: { x: point.x !== here.x ? point.x : null, y: point.y !== here.y ? point.y : null } }
    }

    function down(e: MouseEvent) {
      // Holding space is a request to pan the board, which outranks the tool.
      if (e.button !== 0 || controlState.dSpaceDown) return
      const board = document.getElementById('page-design')
      const view = stage()
      if (!board || !view || !board.contains(e.target as Node)) return
      e.preventDefault()
      e.stopPropagation()

      const here = view.at(e)
      if (closesAt(here, view.scale)) {
        // Two points have no inside to close off — the way back lies along the
        // way out — so running them together finishes the line instead.
        finish(draftRef.current.points.length >= 3)
        return
      }
      if (endsAt(here, view.scale)) {
        finish(false)
        return
      }

      const { point, guides } = place(here, e, view.scale, view.positions)
      const index = draftRef.current.points.length
      set({ points: [...draftRef.current.points, { x: point.x, y: point.y }], guides, cursor: null })

      /** Pulls a pair of control handles out of the point that has just gone down. */
      function pull(ev: MouseEvent) {
        ev.preventDefault()
        const at = view!.at(ev)
        const dx = at.x - point.x
        const dy = at.y - point.y
        if (Math.hypot(dx, dy) * view!.scale < PULL_SLOP) return
        const reach = ev.shiftKey ? straighten(at, point) : at
        const out = { x: reach.x - point.x, y: reach.y - point.y }
        const next = [...draftRef.current.points]
        // Alt leaves the incoming side square while the outgoing side curves,
        // which is the cusp where a curve meets a straight run.
        next[index] = ev.altKey ? { x: point.x, y: point.y, out } : { x: point.x, y: point.y, in: { x: -out.x, y: -out.y }, out }
        set({ points: next })
      }

      function drop() {
        document.removeEventListener('mousemove', pull, true)
        document.removeEventListener('mouseup', drop, true)
        pulling = null
      }

      pulling = drop
      document.addEventListener('mousemove', pull, true)
      document.addEventListener('mouseup', drop, true)
    }

    /** The length of line that follows the pointer between one point and the next. */
    function hover(e: MouseEvent) {
      if (pulling || !draftRef.current.points.length) return
      const board = document.getElementById('page-design')
      const view = stage()
      if (!board || !view || !board.contains(e.target as Node)) {
        // Every move over the panels comes through here, so a draft that is
        // already put away is left alone rather than replaced with a copy.
        const held = draftRef.current
        if (held.cursor || held.closing || held.guides.x !== null || held.guides.y !== null) {
          set({ cursor: null, closing: false, guides: { x: null, y: null } })
        }
        return
      }
      const here = view.at(e)
      if (closesAt(here, view.scale)) {
        set({ cursor: draftRef.current.points[0], closing: true, guides: { x: null, y: null } })
        return
      }
      const { point, guides } = place(here, e, view.scale, view.positions)
      set({ cursor: point, closing: false, guides })
    }

    function key(e: KeyboardEvent) {
      if (e.key !== 'Escape' && e.key !== 'Enter') return
      if (!draftRef.current.points.length) return
      e.preventDefault()
      e.stopPropagation()
      finish(false)
    }

    /** Puts the path on the page and hands the pointer back. */
    function finish(closed: boolean) {
      if (done) return
      done = true
      const points = draftRef.current.points
      pulling?.()
      draftRef.current = EMPTY
      setDraft(EMPTY)
      // One path per arming, so what has just been drawn can be styled without
      // the next click on it starting another one on top. Only ever the pen's
      // own arming: this also runs when the tool is put back, and by then
      // another tool may already be armed in its place.
      if (controlState.dDrawTool === 'pen') setDrawTool(null)
      addPath(points, closed)
    }

    document.addEventListener('mousedown', down, true)
    document.addEventListener('mousemove', hover, true)
    document.addEventListener('keydown', key, true)
    return () => {
      document.removeEventListener('mousedown', down, true)
      document.removeEventListener('mousemove', hover, true)
      document.removeEventListener('keydown', key, true)
      pulling?.()
      root?.classList.remove('draw-case')
      // The tool can be put back from the panel as well as from the path, and a
      // path half drawn when that happens is still a path: it goes on the page
      // rather than disappearing with the tool that drew it.
      finish(false)
      draftRef.current = EMPTY
      setDraft(EMPTY)
    }
  }, [armed])

  if (!armed) return null

  const scale = 100 / (canvas.dZoom || 100)
  const page = canvas.dPage
  const { points, cursor, closing, guides } = draft
  const last = points[points.length - 1]
  const ahead = cursor && last ? pathD(closing ? [last, { ...points[0] }] : [last, cursor], false, PAGE_BOX) : ''
  const stalk = last?.out ? { x: last.x + last.out.x, y: last.y + last.out.y } : null

  return (
    <>
      <div className="draw-hint" role="status">
        <b>Click to place a point, drag to curve it.</b> Click the first point to close the shape, Enter or Esc to leave it open.
      </div>
      {canvasEl
        ? createPortal(
            <svg className="draw-pen" width={page.width} height={page.height} viewBox={`0 0 ${page.width} ${page.height}`}>
              {guides.x !== null ? <line className="draw-pen__guide" x1={guides.x} y1={0} x2={guides.x} y2={page.height} strokeWidth={scale} /> : null}
              {guides.y !== null ? <line className="draw-pen__guide" x1={0} y1={guides.y} x2={page.width} y2={guides.y} strokeWidth={scale} /> : null}
              <path className="draw-pen__line" d={pathD(points, false, PAGE_BOX)} fill="none" strokeWidth={2 * scale} />
              {ahead ? <path className="draw-pen__ahead" d={ahead} fill="none" strokeWidth={scale} strokeDasharray={`${4 * scale} ${3 * scale}`} /> : null}
              {/* The handle being pulled out of the point that has just gone down. */}
              {stalk ? (
                <>
                  <line className="draw-pen__stalk" x1={last.x} y1={last.y} x2={stalk.x} y2={stalk.y} strokeWidth={scale} />
                  <circle className="draw-pen__handle" cx={stalk.x} cy={stalk.y} r={4 * scale} strokeWidth={scale} />
                </>
              ) : null}
              {points.map((point, index) => (
                <rect
                  key={index}
                  className={cx('draw-pen__point', { 'draw-pen__point--close': closing && index === 0 })}
                  x={point.x - (closing && index === 0 ? 6 : 4) * scale}
                  y={point.y - (closing && index === 0 ? 6 : 4) * scale}
                  width={(closing && index === 0 ? 12 : 8) * scale}
                  height={(closing && index === 0 ? 12 : 8) * scale}
                  strokeWidth={scale}
                />
              ))}
            </svg>,
            canvasEl,
          )
        : null}
    </>
  )
}

/**
 * Wraps a frame round what was drawn and puts it on the page.
 *
 * Bracketed by hand because the tool swallows every press the path was made of:
 * see `beginHistory`. Without it the path appears and Ctrl+Z has nothing to
 * undo. One entry covers the whole path, however many points it took, which is
 * what makes Escape safe to use as the way out of a path you did not want.
 */
function addPath(points: TPathPoint[], closed: boolean) {
  // One point is a click on the page that changed its mind, not a path.
  if (points.length < 2) return
  const setting: any = closed ? closedPathSetting() : openPathSetting()
  const fitted = fitFrame(points, closed, (setting.borderWidth || 0) / 2)
  setting.left = fitted.box.left
  setting.top = fitted.box.top
  setting.width = fitted.box.width
  setting.height = fitted.box.height
  setting.points = fitted.points
  setting.closed = closed
  recordHistory(() => addWidget(setting))
}
