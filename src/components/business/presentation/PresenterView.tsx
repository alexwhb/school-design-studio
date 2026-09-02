import { useEffect, useRef, useState, type RefObject } from 'react'
import { useSnapshot } from 'valtio'
import { widgetState } from '@/store/state'
import { openPresenterChannel, type TPresenterMessage, type TPresenterState } from './presenterLink'
import Elapsed from './Elapsed'
import SlideView from './SlideView'
import type { TdLayout } from '@/store/types'

/**
 * What the person talking looks at while the room looks at the slide.
 *
 * The slide that is up, the one coming, the notes for this page, the clock and
 * how far through the deck you are. Drawn into a second window, so it can be
 * dragged onto a laptop screen while the presenter fills the projector.
 *
 * It reads the design straight out of the store — it is rendered by the editor's
 * own React tree through a portal, so the artwork is the same components the
 * presenter draws, live, with no copy to keep in step. What it does not read is
 * where the talk has got to: that belongs to the presenter, and arrives over the
 * channel. Presses go back the same way, because a key pressed in this window is
 * an event in this window's document and the presenter would never see it.
 */
function useBox(ref: RefObject<HTMLElement | null>) {
  const [box, setBox] = useState({ width: 0, height: 0 })
  useEffect(() => {
    const el = ref.current
    const view = el?.ownerDocument.defaultView
    if (!el || !view) return
    const measure = () => setBox({ width: el.clientWidth, height: el.clientHeight })
    measure()
    // The observer has to come from the window the element is in, or it never
    // reports; a resize listener is the fallback for anything that lacks one.
    const Observer = (view as unknown as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver
    if (Observer) {
      const observer = new Observer(measure)
      observer.observe(el)
      return () => observer.disconnect()
    }
    view.addEventListener('resize', measure)
    return () => view.removeEventListener('resize', measure)
  }, [ref])
  return box
}

const STEP_FORWARD = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter']
const STEP_BACK = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace']

export default function PresenterView() {
  const pages = useSnapshot(widgetState).dLayouts as readonly TdLayout[]
  const [talk, setTalk] = useState<TPresenterState>({ index: 0, startedAt: Date.now(), live: true })

  const rootRef = useRef<HTMLDivElement | null>(null)
  const nowRef = useRef<HTMLDivElement | null>(null)
  const nextRef = useRef<HTMLDivElement | null>(null)
  const nowBox = useBox(nowRef)
  const nextBox = useBox(nextRef)
  const channel = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const link = openPresenterChannel()
    channel.current = link
    if (!link) return
    link.onmessage = (event: MessageEvent) => {
      const message = event.data as TPresenterMessage | null
      if (message?.kind === 'state') setTalk(message)
    }
    // A view that has just opened has no idea where the talk is.
    link.postMessage({ kind: 'hello' } satisfies TPresenterMessage)
    return () => {
      link.close()
      channel.current = null
    }
  }, [])

  const send = (message: TPresenterMessage) => channel.current?.postMessage(message)

  useEffect(() => {
    const view = rootRef.current?.ownerDocument.defaultView
    if (!view) return
    const onKeydown = (e: KeyboardEvent) => {
      if (STEP_FORWARD.includes(e.key)) {
        e.preventDefault()
        send({ kind: 'step', by: 1 })
      } else if (STEP_BACK.includes(e.key)) {
        e.preventDefault()
        send({ kind: 'step', by: -1 })
      } else if (e.key === 'Escape') {
        e.preventDefault()
        view.close()
      }
    }
    view.addEventListener('keydown', onKeydown)
    return () => view.removeEventListener('keydown', onKeydown)
  }, [])

  const index = Math.max(0, Math.min(talk.index, pages.length - 1))
  const current = pages[index] as TdLayout | undefined
  const upcoming = pages[index + 1] as TdLayout | undefined
  const notes = String(current?.global?.notes ?? '').trim()

  return (
    // A React portal's events bubble through the React tree rather than the DOM,
    // so without this a click in this window would also be a click on the stage
    // in the window behind, and turn the page.
    <div className="presenter" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      <div className="presenter__bar">
        <span className="presenter__count">
          Slide <b>{index + 1}</b> of {pages.length}
        </span>
        <Elapsed
          startedAt={talk.startedAt}
          onReset={() => send({ kind: 'restartClock' })}
          className="presenter__timer"
          title="Time on this presentation — click to start it again"
        />
        <span className="presenter__spacer" />
        <button type="button" className="presenter__btn" onClick={() => send({ kind: 'step', by: -1 })} disabled={!talk.live}>
          Back
        </button>
        <button type="button" className="presenter__btn presenter__btn--go" onClick={() => send({ kind: 'step', by: 1 })} disabled={!talk.live}>
          Next
        </button>
      </div>

      {talk.live ? null : <div className="presenter__ended">The presentation has ended. You can close this window.</div>}

      <div className="presenter__body">
        <div className="presenter__now" ref={nowRef}>
          {current ? <SlideView page={current} maxWidth={nowBox.width} maxHeight={nowBox.height} /> : null}
        </div>
        <div className="presenter__side">
          <div className="presenter__label">Coming next</div>
          <div className="presenter__next" ref={nextRef}>
            {upcoming ? (
              <SlideView page={upcoming} maxWidth={nextBox.width} maxHeight={nextBox.height} />
            ) : (
              <span className="presenter__last">Last slide</span>
            )}
          </div>
          <div className="presenter__label">Your notes</div>
          <div className={notes ? 'presenter__notes' : 'presenter__notes is-empty'}>
            {notes || 'Nothing written for this page. Notes are typed in the drawer under the canvas.'}
          </div>
        </div>
      </div>
    </div>
  )
}
