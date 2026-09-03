/**
 * The text tool: arm it, then pull a box out of the page and type into it.
 *
 * Adobe XD's text tool, which answers two gestures rather than one. A drag
 * gives a box of exactly that width, and the words wrap inside it; a click
 * places a box of a readable default width at that point. Either way the box
 * arrives selected with the caret already in it, so the first thing you do
 * after drawing one is type, not double-click it.
 *
 * A box nobody typed into is taken back off the page when the caret leaves it,
 * which is what XD does and what stops a mis-aimed click leaving an empty
 * layer nothing on the canvas can show. That is `watchForAbandon` below.
 *
 * The gesture is the shape tools', so the way it is taken is theirs too: a
 * capture-phase listener on the document, because the board selects and starts
 * moving layers from a native listener on `#page-design`, and edges are pulled
 * into line with the page and everything on it by the same snapping. What
 * differs is only what is left behind, which is why this is a component beside
 * `DrawShape` rather than another branch inside it.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSnapshot } from 'valtio'
import { recordHistory } from '@/common/hooks/history'
import getSnapPositions from '@/common/methods/snapping'
import { getAppRoot } from '@/common/hooks/appRoot'
import { canvasState, controlState, widgetState } from '@/store/state'
import { subscribeSelector } from '@/store/subscribe'
import { setDrawTool } from '@/store/control'
import { addWidget, removeWidget } from '@/store/widget'
import { clearSelection } from '@/store/widget/select'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import { SNAP_THRESHOLD, canvasScale, clamp, snap } from './drawGeometry'
import './drawText.less'

type TBox = { left: number; top: number; width: number; height: number }

/** Below this, a drag was a click that wobbled and a default box is meant. */
const MIN_DRAG = 12

/** What a click places, in design pixels — a line and a half of body text. */
const DEFAULT_WIDTH = 320

export default function DrawText() {
  const control = useSnapshot(controlState)
  const canvas = useSnapshot(canvasState)
  const armed = control.dDrawTool === 'text'
  const [canvasEl, setCanvasEl] = useState<HTMLElement | null>(null)
  const [band, setBand] = useState<TBox | null>(null)
  const [guides, setGuides] = useState<{ x: number | null; y: number | null }>({ x: null, y: null })
  const bandRef = useRef<TBox | null>(null)
  /** Takes down a box being pulled right now, wherever the tool is let go of. */
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
    // Nothing is being edited while a box is being drawn, and the selection box
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

      function move(ev: MouseEvent) {
        ev.preventDefault()
        const here = point(ev)
        // No Shift and no Alt here, unlike the shape tools: a square text box
        // and one grown out of its centre are not things anybody asks for, and
        // offering them would be two more modifiers in the hint for nothing.
        const to = { x: snap(here.x, positions.x, tolerance), y: snap(here.y, positions.y, tolerance) }
        const next = {
          left: Math.min(from.x, to.x),
          top: Math.min(from.y, to.y),
          width: Math.abs(to.x - from.x),
          height: Math.abs(to.y - from.y),
        }
        bandRef.current = next
        setBand(next)
        setGuides({ x: to.x !== here.x ? to.x : null, y: to.y !== here.y ? to.y : null })
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
        // One box per arming, so what has just been drawn can be typed into
        // without the next click on it starting another one on top.
        setDrawTool(null)
        addTextBox(drawn, from, page)
      }

      abandon.current = cancel
      document.addEventListener('mousemove', move, true)
      document.addEventListener('mouseup', up, true)
    }

    document.addEventListener('mousedown', down, true)
    return () => {
      document.removeEventListener('mousedown', down, true)
      root?.classList.remove('draw-case')
      // Escape mid-drag disarms the tool, which lands here. The box being
      // pulled goes with it rather than finishing itself off on the next mouseup.
      abandon.current?.()
    }
  }, [armed])

  if (!armed) return null

  const scale = 100 / (canvas.dZoom || 100)
  const page = canvas.dPage
  const below = band ? band.top + band.height + 24 * scale <= page.height : true

  return (
    <>
      {canvasEl && band
        ? createPortal(
            // The wrapper and the snap guides are the shape tools' — see
            // drawShape.less. Only the band itself is drawn differently, because
            // what is coming is a box of words rather than a filled shape.
            <div className="draw-band__wrap">
              {guides.x !== null ? <i className="draw-guide draw-guide--v" style={{ left: `${guides.x}px`, width: `${scale}px` }} /> : null}
              {guides.y !== null ? <i className="draw-guide draw-guide--h" style={{ top: `${guides.y}px`, height: `${scale}px` }} /> : null}
              <div
                className="draw-text-band"
                style={{
                  left: `${band.left}px`,
                  top: `${band.top}px`,
                  width: `${band.width}px`,
                  height: `${band.height}px`,
                  borderWidth: `${scale}px`,
                }}
              >
                <span
                  className="draw-text-band__size"
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
 * Puts an empty text box on the page and opens it for typing.
 *
 * Empty rather than filled with a line of placeholder text: an untouched box is
 * then anything with no words in it, which is what `watchForAbandon` takes back
 * off the page, and there is no sentence for somebody to leave behind by
 * clicking away at the wrong moment.
 *
 * Bracketed by hand because the tool swallows both ends of the gesture: see
 * `beginHistory`. Without it the box appears and Ctrl+Z has nothing to undo.
 */
function addTextBox(drawn: TBox | null, origin: { x: number; y: number }, page: { width: number; height: number }) {
  const setting: any = JSON.parse(JSON.stringify(wTextSetting))
  if (drawn && drawn.width >= MIN_DRAG && drawn.height >= MIN_DRAG) {
    setting.left = Math.round(drawn.left)
    setting.top = Math.round(drawn.top)
    setting.width = Math.round(drawn.width)
    setting.height = Math.round(drawn.height)
  } else {
    // A click, so a box of a readable width starting where it was clicked.
    const width = Math.round(Math.min(DEFAULT_WIDTH, page.width))
    const height = Math.round(setting.fontSize * setting.lineHeight)
    setting.width = width
    setting.height = height
    setting.left = Math.round(clamp(origin.x, 0, page.width - width))
    setting.top = Math.round(clamp(origin.y - height / 2, 0, page.height - height))
  }
  recordHistory(() => addWidget(setting))

  const placed = widgetState.dWidgets[widgetState.dWidgets.length - 1]
  if (!placed) return
  const uuid = String(placed.uuid)
  putCaretIn(uuid)
  watchForAbandon(uuid)
}

/**
 * Opens the new box for typing, by double-clicking it.
 *
 * The caret is `w-text`'s own affair — whether a box is being edited is state
 * inside that component, and a double-click is the door into it. Rather than
 * cut a second door for one caller, the tool knocks on the one that is there.
 * The wait is for the box to reach the page: the widget is added to the store
 * here and React has it on screen a frame or two later.
 */
function putCaretIn(uuid: string) {
  const deadline = performance.now() + 1000
  const knock = () => {
    const el = document.getElementById(uuid)
    if (el) {
      el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, view: window }))
      return
    }
    if (performance.now() < deadline) requestAnimationFrame(knock)
  }
  requestAnimationFrame(knock)
}

/** Whether a box has anything in it once the markup is taken off. */
function hasWords(text: unknown) {
  return String(text ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim().length > 0
}

/**
 * Takes a box that was drawn and never typed into back off the page.
 *
 * XD does the same, and without it every stray click with the tool armed leaves
 * an empty layer behind — one with no height, so there is nothing on the canvas
 * to find it by and nothing but the layer list to delete it from. The moment to
 * check is when the caret leaves: the box writes `editable` back to false then,
 * and the words it was holding are stored just before that. A box that has held
 * words at any point is left alone, however empty it ends up — emptying a box
 * by hand is an edit, not an abandonment.
 */
function watchForAbandon(uuid: string) {
  let entered = false
  const stop = subscribeSelector(
    widgetState,
    () => {
      const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
      return [!!widget, !!widget?.editable, hasWords(widget?.text)]
    },
    ([alive, editing, words]) => {
      // Gone already, or it has words in it now and whatever happens to them
      // next is an edit rather than an abandonment. Either way there is
      // nothing left to wait for.
      if (!alive || words) {
        stop()
        return
      }
      if (editing) {
        entered = true
        return
      }
      if (!entered) return
      stop()
      // Its own undo entry. The click that took the caret out of the box has
      // usually bracketed one already, and an empty diff is not an entry, so at
      // worst this is the same step recorded twice and stored once.
      recordHistory(() => removeWidget(uuid))
    },
  )
}
