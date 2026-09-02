import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSnapshot } from 'valtio'
import { getPortalContainer } from '@/common/hooks/appRoot'
import { canvasState, widgetState } from '@/store/state'
import { showPage } from '@/store/widget/pages'
import { cancelTransitions, playTransition, prefersReducedMotion, readTransition } from '@/common/animations/transitions'
import SlideView, { type SlideViewHandle } from './SlideView'
import PresenterView from './PresenterView'
import Elapsed from './Elapsed'
import { openPresenterChannel, openPresenterWindow, type TPresenterMessage, type TPresenterState, type TPresenterWindow } from './presenterLink'
import { cx } from '@/utils/dom'
import type { TdLayout } from '@/store/types'
import './presentMode.less'

export type PresentModeHandle = {
  open: (startAt?: number) => void
  close: () => void
}

/** How long the mouse has to sit still before the controls and cursor fade. */
const IDLE_AFTER = 2600
/** Trackpads report a stream of small deltas; only a decisive one turns a page. */
const WHEEL_THRESHOLD = 40
const WHEEL_COOLDOWN = 420
const SWIPE_THRESHOLD = 50
/** How many slides either side of the current one to draw before they are needed. */
const REACH = 2

const NEXT_KEYS = ['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Spacebar', 'Enter']
const PREV_KEYS = ['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace', 'p', 'P']

function pageLabel(page: TdLayout | undefined, position: number) {
  const name = page?.global?.name
  return name && name !== 'New page' ? name : `Page ${position + 1}`
}

/**
 * Presentation mode.
 *
 * The design's pages become slides on a full-screen black stage: no toolbars,
 * no panels, nothing but the artwork. Arrow keys, space and page up/down move
 * between slides the way they do in every other presentation tool, so nobody
 * has to learn anything before standing up in front of a room.
 *
 * A slide is mounted once it comes within reach of the current one, and then
 * stays mounted for the rest of the session. Walking forwards through a talk
 * therefore pays for each slide just ahead of needing it, and going back to one
 * costs nothing — it is still there, images and all, so moving between slides is
 * a cross-fade rather than a fresh render. Mounting the whole deck up front
 * would be simpler, but a design may run to MAX_PAGES.
 */
const PresentMode = forwardRef<PresentModeHandle, {}>(function PresentMode(_props, ref) {
  const pages = useSnapshot(widgetState).dLayouts as readonly TdLayout[]

  const [isOpen, setIsOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [isOverview, setIsOverview] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [curtain, setCurtain] = useState<'' | 'black' | 'white'>('')
  const [stage, setStage] = useState({ width: 0, height: 0 })
  const [startedAt, setStartedAt] = useState(0)
  /** The notes overlay over the stage, on N. */
  const [showNotes, setShowNotes] = useState(false)
  /** Set when the browser refused the second window, so the overlay can say why it is here. */
  const [viewBlocked, setViewBlocked] = useState(false)
  /** Where the presenter view is drawn, once there is a window to draw it in. */
  const [viewMount, setViewMount] = useState<HTMLElement | null>(null)
  /** Slides drawn so far. Only ever grows, so going back is instant. */
  const [mounted, setMounted] = useState<Set<number>>(() => new Set())

  /**
   * Where the current slide is in its own build.
   *
   * A slide whose elements have entrances is worth more than one advance: the
   * first shows the slide, and each one after it brings on the next group of
   * elements. Only once a slide has run out of builds does advancing turn the
   * page.
   */
  const [buildStep, setBuildStep] = useState(0)
  const [slideSteps, setSlideSteps] = useState(1)
  const lastBuildStep = Math.max(0, slideSteps - 1)
  const hasBuildsLeft = buildStep < lastBuildStep

  const rootRef = useRef<HTMLDivElement | null>(null)
  const stageRef = useRef<HTMLDivElement | null>(null)
  /** The mounted SlideView for each slide, so its build can be driven from here. */
  const slides = useRef(new Map<number, SlideViewHandle | null>())
  /** The slot each slide sits in, which is what a transition moves. */
  const slots = useRef(new Map<number, HTMLDivElement>())
  /** The transition in flight, if any, so the next press can cancel it rather than stack on it. */
  const transitioning = useRef<Animation[]>([])
  /** The slide on screen before the last change of index. */
  const cameFrom = useRef<number | null>(null)
  /** The second window, so it can be raised rather than opened twice, and shut when the talk ends. */
  const viewWindow = useRef<TPresenterWindow | null>(null)
  const channel = useRef<BroadcastChannel | null>(null)
  /** The last state broadcast, so a view that says hello can be answered without re-deriving it. */
  const broadcast = useRef<TPresenterState>({ index: 0, startedAt: 0, live: false })
  const idleTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const lastWheel = useRef(0)
  const touchStartX = useRef(0)
  /** Set while we ourselves are leaving full screen, to tell that apart from Esc. */
  const leavingFullscreenOnPurpose = useRef(false)
  const previousIndex = useRef<number | undefined>(undefined)

  // Every callback below is reachable from a listener bound once, so the live
  // values are read through a ref rather than captured at bind time.
  const live = useRef({ isOpen, index, isOverview, curtain, buildStep, lastBuildStep, hasBuildsLeft, pages })
  live.current = { isOpen, index, isOverview, curtain, buildStep, lastBuildStep, hasBuildsLeft, pages }

  const clamp = useCallback((n: number) => Math.max(0, Math.min(n, live.current.pages.length - 1)), [])

  /** Any sign of life brings the controls and the cursor back for a moment. */
  const wake = useCallback(() => {
    setIsIdle(false)
    clearTimeout(idleTimer.current)
    idleTimer.current = setTimeout(() => {
      if (!live.current.isOverview) setIsIdle(true)
    }, IDLE_AFTER)
  }, [])

  /**
   * Draws the current slide and its neighbours, keeping everything drawn before.
   *
   * Returns the same Set when there is nothing new to draw. A fresh one every
   * time would change the identity of a dependency of the arrival effect below,
   * which would then re-run, call this again, and cancel the frame it had
   * queued to start the slide's entrances — so nothing would ever play.
   */
  const reach = useCallback((centre: number) => {
    setMounted((previous) => {
      let next: Set<number> | null = null
      for (let i = centre - REACH; i <= centre + REACH; i++) {
        if (i < 0 || i >= live.current.pages.length || previous.has(i)) continue
        next = next ?? new Set(previous)
        next.add(i)
      }
      return next ?? previous
    })
  }, [])

  const goTo = useCallback(
    (n: number, { closeOverview = false }: { closeOverview?: boolean } = {}) => {
      setCurtain('')
      setIndex(clamp(n))
      if (closeOverview) setIsOverview(false)
    },
    [clamp],
  )

  const next = useCallback(() => {
    if (live.current.hasBuildsLeft) {
      setCurtain('')
      const step = live.current.buildStep + 1
      setBuildStep(step)
      slides.current.get(live.current.index)?.showUpTo(step, true)
      return
    }
    if (live.current.index < live.current.pages.length - 1) goTo(live.current.index + 1)
  }, [goTo])

  const prev = useCallback(() => {
    if (live.current.buildStep > 0) {
      setCurtain('')
      const step = live.current.buildStep - 1
      setBuildStep(step)
      slides.current.get(live.current.index)?.showUpTo(step, false)
      return
    }
    if (live.current.index > 0) goTo(live.current.index - 1)
  }, [goTo])

  /**
   * The stage always fills the viewport, so the slide is re-fitted whenever that
   * changes — a window resize, a rotated tablet, or moving in and out of full
   * screen, which is the one that happens in front of an audience.
   */
  const measureStage = useCallback(() => {
    const el = stageRef.current
    if (!el) return
    setStage({ width: el.clientWidth, height: el.clientHeight })
  }, [])

  const enterFullscreen = useCallback(async () => {
    const el = rootRef.current
    if (!el || document.fullscreenElement) return
    try {
      await el.requestFullscreen()
    } catch {
      // Some browsers refuse without a direct gesture, and some are in a mode
      // that forbids it outright. The overlay already covers the viewport, so
      // the presentation still works — it just keeps the browser chrome.
    }
    setIsFullscreen(!!document.fullscreenElement)
  }, [])

  const exitFullscreen = useCallback(() => {
    if (!document.fullscreenElement) return
    leavingFullscreenOnPurpose.current = true
    document.exitFullscreen().catch(() => {})
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) exitFullscreen()
    else void enterFullscreen()
  }, [enterFullscreen, exitFullscreen])

  /**
   * Shuts the presenter view. The talk ending, or this window going away, has to
   * take it with them: a second window left behind shows notes for a slide
   * nobody is looking at any more.
   */
  const closePresenterView = useCallback(() => {
    const view = viewWindow.current
    viewWindow.current = null
    setViewMount(null)
    setViewBlocked(false)
    if (view && !view.window.closed) view.window.close()
  }, [])

  /**
   * Puts the presenter view in a second window — what is on screen, what is
   * coming, the notes and the clock — so it can be dragged onto the laptop while
   * the projector keeps the slide. Asking twice raises the window already open.
   *
   * A browser that blocks the pop-up leaves nothing to see, so the notes overlay
   * opens instead with a line saying why. There is nowhere else to say it: a
   * toast is drawn outside the full-screen element and would not appear at all.
   */
  const openPresenterView = useCallback(() => {
    const existing = viewWindow.current
    if (existing && !existing.window.closed) {
      existing.window.focus()
      return
    }
    // Opening a window drops some browsers out of full screen, and that must not
    // be read as the Esc that ends the talk. The flag is dropped again shortly
    // after, in case this browser stayed in full screen and a real Esc follows.
    leavingFullscreenOnPurpose.current = true
    setTimeout(() => {
      leavingFullscreenOnPurpose.current = false
    }, 600)

    const opened = openPresenterWindow()
    if (!opened) {
      viewWindow.current = null
      setViewMount(null)
      setViewBlocked(true)
      setShowNotes(true)
      return
    }
    setViewBlocked(false)
    viewWindow.current = opened
    setViewMount(opened.mount)
    // Closed from its own title bar rather than from here: forget it, so the
    // button opens a fresh one instead of raising a window that has gone.
    opened.window.addEventListener('pagehide', () => {
      if (viewWindow.current?.window !== opened.window) return
      viewWindow.current = null
      setViewMount(null)
    })
  }, [])

  /**
   * Ends the show and leaves the editor on whichever slide the talk finished on,
   * which is nearly always the one you want to go back and fix.
   */
  const close = useCallback(() => {
    if (!live.current.isOpen) return
    setIsOpen(false)
    setIsOverview(false)
    setCurtain('')
    setShowNotes(false)
    closePresenterView()
    clearTimeout(idleTimer.current)
    exitFullscreen()
    // Put the editor on the slide the talk finished on. The store owns the
    // order these have to happen in.
    const page = live.current.index
    if (page !== canvasState.dCurrentPage && widgetState.dLayouts[page]) showPage(page)
  }, [exitFullscreen, closePresenterView])

  const open = useCallback(
    (startAt?: number) => {
      if (live.current.isOpen) return
      if (live.current.pages.length === 0) return

      const start = clamp(startAt ?? canvasState.dCurrentPage)
      previousIndex.current = undefined
      setIndex(start)
      setIsOverview(false)
      setCurtain('')
      setShowNotes(false)
      setIsIdle(false)
      setStartedAt(Date.now())
      setMounted(new Set())
      reach(start)
      setIsOpen(true)
      wake()
    },
    [clamp, reach, wake],
  )

  useImperativeHandle(ref, () => ({ open, close }), [open, close])

  /**
   * The channel to the presenter view, open for as long as the editor is rather
   * than only during a talk: a view that outlived its presentation still has to
   * be answered, if only to be told the talk has ended.
   */
  useEffect(() => {
    const link = openPresenterChannel()
    channel.current = link
    if (!link) return
    link.onmessage = (event: MessageEvent) => {
      const message = event.data as TPresenterMessage | null
      if (!message) return
      if (message.kind === 'hello') {
        link.postMessage({ kind: 'state', ...broadcast.current } satisfies TPresenterMessage)
        return
      }
      if (!live.current.isOpen) return
      if (message.kind === 'step') message.by > 0 ? next() : prev()
      else if (message.kind === 'restartClock') setStartedAt(Date.now())
    }
    return () => {
      link.close()
      channel.current = null
    }
  }, [next, prev])

  // Where the talk has got to. The view holds none of this itself, so this is
  // the only thing that tells it the slide has changed.
  useEffect(() => {
    broadcast.current = { index, startedAt, live: isOpen }
    channel.current?.postMessage({ kind: 'state', ...broadcast.current } satisfies TPresenterMessage)
  }, [index, startedAt, isOpen])

  // A second window must not outlive the tab that opened it.
  useEffect(() => {
    const onPageHide = () => closePresenterView()
    window.addEventListener('pagehide', onPageHide)
    return () => {
      window.removeEventListener('pagehide', onPageHide)
      closePresenterView()
    }
  }, [closePresenterView])

  // Focus, measure and go full screen once the stage is actually in the document.
  useEffect(() => {
    if (!isOpen) return
    rootRef.current?.focus()
    measureStage()
    void enterFullscreen()
  }, [isOpen, measureStage, enterFullscreen])

  /**
   * Runs on capture so the editor's own shortcuts never see these keys — an
   * arrow key mid-presentation must not nudge a layer on the page behind us.
   */
  useEffect(() => {
    if (!isOpen) return

    const onKeydown = (e: KeyboardEvent) => {
      const handled = () => {
        e.preventDefault()
        e.stopPropagation()
        wake()
      }

      if (e.key === 'Escape') {
        handled()
        if (live.current.isOverview) setIsOverview(false)
        else if (live.current.curtain) setCurtain('')
        else close()
        return
      }

      // Anything that moves the talk along also lifts a blanked screen, rather
      // than needing the same key twice.
      const lift = () => {
        if (!live.current.curtain) return false
        setCurtain('')
        return true
      }

      if (NEXT_KEYS.includes(e.key)) {
        handled()
        if (!lift()) next()
        return
      }
      if (PREV_KEYS.includes(e.key)) {
        handled()
        if (!lift()) prev()
        return
      }

      switch (e.key) {
        case 'Home':
          handled()
          goTo(0)
          break
        case 'End':
          handled()
          goTo(live.current.pages.length - 1)
          break
        case 'f':
        case 'F':
          handled()
          toggleFullscreen()
          break
        case 'b':
        case 'B':
          handled()
          setCurtain((value) => (value === 'black' ? '' : 'black'))
          break
        case 'w':
        case 'W':
          handled()
          setCurtain((value) => (value === 'white' ? '' : 'white'))
          break
        case 'g':
        case 'G':
        case 'o':
        case 'O':
          handled()
          setIsOverview((value) => !value)
          break
        case 'n':
        case 'N':
          handled()
          setShowNotes((value) => !value)
          break
        case 's':
        case 'S':
          handled()
          openPresenterView()
          break
        default:
          // A digit jumps straight to that slide, for questions at the end.
          if (/^[1-9]$/.test(e.key)) {
            handled()
            goTo(Number(e.key) - 1)
          }
      }
    }

    /**
     * In full screen the browser swallows Esc to drop out of it, so our own key
     * handler never sees it. Treat that as "end the presentation", which is what
     * pressing Esc during a talk is meant to do — unless we were the ones who
     * asked to leave full screen, via the F key or the button.
     */
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      requestAnimationFrame(measureStage)
      if (document.fullscreenElement) return
      if (leavingFullscreenOnPurpose.current) {
        leavingFullscreenOnPurpose.current = false
        return
      }
      close()
    }

    // React binds wheel at its root as passive, so preventDefault has to come
    // from a listener bound here: without it the editor scrolls behind the stage.
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      if (live.current.isOverview) return
      const now = Date.now()
      if (now - lastWheel.current < WHEEL_COOLDOWN) return
      const delta = Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX
      if (Math.abs(delta) < WHEEL_THRESHOLD) return
      lastWheel.current = now
      delta > 0 ? next() : prev()
    }
    const root = rootRef.current

    window.addEventListener('keydown', onKeydown, true)
    window.addEventListener('resize', measureStage)
    document.addEventListener('fullscreenchange', onFullscreenChange)
    root?.addEventListener('wheel', onWheel, { passive: false })
    return () => {
      window.removeEventListener('keydown', onKeydown, true)
      window.removeEventListener('resize', measureStage)
      document.removeEventListener('fullscreenchange', onFullscreenChange)
      root?.removeEventListener('wheel', onWheel)
    }
  }, [isOpen, close, goTo, next, prev, toggleFullscreen, measureStage, wake, openPresenterView])

  /**
   * Plays the arriving page's transition between the slot being left and the
   * slot being entered.
   *
   * Whatever was still running is cancelled first, which drops both slots
   * straight to their resting CSS: a run of quick presses ends on the right
   * slide with nothing half-faded left behind. Someone who has asked their
   * system for less motion gets a plain cut. Opening the presenter is not a
   * change of slide, so nothing plays then.
   */
  useEffect(() => {
    if (!isOpen) {
      cameFrom.current = null
      return
    }
    const from = cameFrom.current
    cameFrom.current = index
    cancelTransitions(transitioning.current)
    transitioning.current = []
    if (from === null || from === index) return

    const transition = readTransition(live.current.pages[index]?.global)
    const inEl = slots.current.get(index)
    const outEl = slots.current.get(from) ?? null
    if (!transition || !inEl || prefersReducedMotion()) return

    // The arriving slot is drawn over the departing one, so a slide can glide
    // in over its predecessor; the order is put back once the transition ends.
    inEl.style.zIndex = '2'
    if (outEl) outEl.style.zIndex = '1'
    const running = playTransition(inEl, outEl, transition, index > from)
    transitioning.current = running
    const settle = () => {
      inEl.style.zIndex = ''
      if (outEl) outEl.style.zIndex = ''
    }
    Promise.all(running.map((animation) => animation.finished.catch(() => undefined))).then(settle)
    return () => {
      cancelTransitions(running)
      settle()
    }
  }, [index, isOpen])

  /**
   * Shows a slide from the top of its build when arriving forwards, and fully
   * built when arriving backwards — the way every other presentation tool
   * behaves, because a build the room has already watched should not be
   * replayed at them.
   */
  useEffect(() => {
    if (!isOpen) return
    reach(index)
    const forwards = previousIndex.current === undefined || index > previousIndex.current
    previousIndex.current = index
    // A slide just brought within reach has not mounted yet, so its handle is
    // read on the next frame rather than during this render.
    const frame = requestAnimationFrame(() => {
      const slide = slides.current.get(index)
      const steps = slide?.stepCount ?? 1
      const step = forwards ? 0 : Math.max(0, steps - 1)
      setSlideSteps(steps)
      setBuildStep(step)
      slide?.showUpTo(step, forwards)
    })
    return () => cancelAnimationFrame(frame)
  }, [index, isOpen, reach, mounted])

  const progress = pages.length < 2 ? 100 : (index / (pages.length - 1)) * 100
  const notes = String((pages[index]?.global as { notes?: string } | undefined)?.notes ?? '').trim()

  function onStageClick() {
    if (live.current.isOverview) return
    if (live.current.curtain) {
      setCurtain('')
      return
    }
    next()
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? 0
    wake()
  }

  function onTouchEnd(e: React.TouchEvent) {
    const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    if (Math.abs(dx) < SWIPE_THRESHOLD) return
    dx < 0 ? next() : prev()
  }

  if (!isOpen) return null

  return createPortal(
    <div
      ref={rootRef}
      className={cx('present', { 'present--idle': isIdle && !isOverview })}
      tabIndex={-1}
      onMouseMove={wake}
      onClick={onStageClick}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div ref={stageRef} className="present__stage">
        {pages.map((page, i) => (
          <div
            key={'slide' + i}
            ref={(el) => {
              if (el) slots.current.set(i, el)
              else slots.current.delete(i)
            }}
            className={cx('present__slot', { 'is-current': i === index })}
            aria-hidden={i !== index}
          >
            {mounted.has(i) ? (
              <SlideView
                ref={(handle: SlideViewHandle | null) => {
                  if (handle) slides.current.set(i, handle)
                  else slides.current.delete(i)
                }}
                page={page as TdLayout}
                maxWidth={stage.width}
                maxHeight={stage.height}
                animated
              />
            ) : null}
          </div>
        ))}
      </div>

      {/* B and W blank the screen mid-talk, so the room looks at you instead. */}
      {curtain ? <div className={`present__curtain present__curtain--${curtain}`} /> : null}

      {/* What to say while this slide is up. Over the stage rather than beside
          it: the slide is a projected image and nothing may take room off it. */}
      {showNotes ? (
        <div className="present__notes" onClick={(e) => e.stopPropagation()}>
          <div className="present__notes-head">
            <span>
              Speaker notes · {index + 1} / {pages.length}
            </span>
            <button type="button" className="present__notes-close" onClick={() => setShowNotes(false)}>
              Hide (N)
            </button>
          </div>
          {viewBlocked ? (
            <p className="present__notes-blocked">
              Your browser blocked the presenter window. Allow pop-ups for this site to put your notes on a second screen.
            </p>
          ) : null}
          <div className={cx('present__notes-body', { 'present__notes-empty': !notes })}>{notes || 'No notes for this page.'}</div>
        </div>
      ) : null}

      {/* Jump to any slide without walking through the ones in between. */}
      {isOverview ? (
        <div
          className="present__overview"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              e.stopPropagation()
              setIsOverview(false)
            }
          }}
        >
          <div className="present__overview-grid">
            {pages.map((page, i) => (
              <button
                key={'thumb' + i}
                type="button"
                className={cx('present__thumb', { 'is-current': i === index })}
                onClick={(e) => {
                  e.stopPropagation()
                  goTo(i, { closeOverview: true })
                }}
              >
                <SlideView page={page as TdLayout} maxWidth={248} maxHeight={140} />
                <span className="present__thumb-num">{i + 1}</span>
                <span className="present__thumb-name">{pageLabel(page as TdLayout, i)}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="present__chrome" onClick={(e) => e.stopPropagation()} onMouseMove={(e) => { e.stopPropagation(); wake() }}>
        <div className="present__bar">
          <button type="button" className="present__btn" title="Previous (←)" disabled={index === 0 && buildStep === 0} onClick={prev}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 8 12l7 7" />
            </svg>
          </button>
          <button type="button" className="present__counter" title="All slides (G)" onClick={() => setIsOverview((v) => !v)}>
            <b>{index + 1}</b> / {pages.length}
          </button>
          <button
            type="button"
            className="present__btn"
            title={hasBuildsLeft ? 'Next build (→)' : 'Next slide (→)'}
            disabled={index >= pages.length - 1 && !hasBuildsLeft}
            onClick={next}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m9 5 7 7-7 7" />
            </svg>
          </button>

          <span className="present__divider" />

          <Elapsed startedAt={startedAt} onReset={() => setStartedAt(Date.now())} />
          <button
            type="button"
            className={cx('present__btn', { 'is-on': showNotes })}
            title="Speaker notes (N)"
            onClick={() => setShowNotes((value) => !value)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 3.5h14v17H5zM8.5 8h7M8.5 12h7M8.5 16h4.5" />
            </svg>
          </button>
          <button
            type="button"
            className={cx('present__btn', { 'is-on': !!viewMount })}
            title="Presenter view (S)"
            onClick={openPresenterView}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="4.5" width="12" height="9" rx="1" />
              <path d="M17 8.5h5v11h-9v-6" />
            </svg>
          </button>
          <button
            type="button"
            className={cx('present__btn', { 'is-on': isOverview })}
            title="All slides (G)"
            onClick={() => setIsOverview((v) => !v)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="7" height="7" rx="1" />
              <rect x="14" y="4" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
          </button>
          <button
            type="button"
            className="present__btn"
            title={isFullscreen ? 'Leave full screen (F)' : 'Full screen (F)'}
            onClick={toggleFullscreen}
          >
            {isFullscreen ? (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
              </svg>
            )}
          </button>
          <button type="button" className="present__btn present__btn--exit" title="End the presentation (Esc)" onClick={close}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="present__progress">
          <span style={{ width: progress + '%' }} />
        </div>
      </div>

      {/* The second window, drawn from here so it can use the same components
          and the same live store. */}
      {viewMount ? createPortal(<PresenterView />, viewMount) : null}
    </div>,
    getPortalContainer() ?? document.body,
  )
})

export default PresentMode
