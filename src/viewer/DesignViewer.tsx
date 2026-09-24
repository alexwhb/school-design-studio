/**
 * A design, read-only, for a phone.
 *
 * The editor needs a mouse, room for three columns and the better part of three
 * megabytes of script, and on a phone all anybody wants is to look at the
 * slides for tonight or check what the sign says. So this draws the pages one
 * under another, each as wide as the space it is given, with the same read-only
 * widgets the presenter and the page thumbnails use, and a Present button that
 * opens the presenter itself.
 *
 * It does not load the editor. Nothing it imports reaches the store, the
 * editing widgets or Moveable (see staticRegistry.ts and PresentStage.tsx), so
 * a host that imports it from `design-studio/viewer` pays for the pages and the
 * presenter and nothing else.
 *
 * The words are real text: selectable, found by the browser's find, read by a
 * screen reader, each page a region named "Page 2 of 6", and each picture's alt
 * text on its img.
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import SlideView from '@/components/business/presentation/SlideView'
import PresentStage, { type PresentModeHandle } from '@/components/business/presentation/PresentStage'
import type { DesignDocument } from '@/compose/types'
import { drawable } from './drawable'
import { cx } from '@/utils/dom'
import '@/assets/styles/embed'
import './designViewer.less'

export type DesignViewerProps = {
  document: DesignDocument
  className?: string
  /** Called with the 0-based page that is most in view, as it changes. */
  onPageChange?(index: number): void
}

/** How wide the viewer is, followed as it changes: a phone turned on its side. */
function useWidth(ref: React.RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setWidth(el.clientWidth)
    measure()
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure)
      return () => window.removeEventListener('resize', measure)
    }
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])
  return width
}

export default function DesignViewer({ document: doc, className, onPageChange }: DesignViewerProps) {
  const pages = useMemo(() => drawable(doc), [doc])
  const rootRef = useRef<HTMLDivElement | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)
  const presentRef = useRef<PresentModeHandle | null>(null)
  const width = useWidth(listRef)
  const [current, setCurrent] = useState(0)
  const changed = useRef(onPageChange)
  changed.current = onPageChange

  // The current page is the one nearest the middle of the screen: what
  // Present starts on, and what the host hears about. On a phone several
  // slides fit at once, so "the one most in view" would always be the first.
  // Any scroll counts, the host's own scrolling box included, which is why it
  // listens on the document in the capture phase.
  useEffect(() => {
    const list = listRef.current
    if (!list) return
    let frame = 0
    const settle = () => {
      frame = 0
      const middle = window.innerHeight / 2
      let best = -1
      let nearest = Number.POSITIVE_INFINITY
      list.querySelectorAll<HTMLElement>('[data-page]').forEach((section) => {
        const box = section.getBoundingClientRect()
        if (box.bottom < 0 || box.top > window.innerHeight) return
        const distance = box.top <= middle && box.bottom >= middle ? 0 : Math.min(Math.abs(box.top - middle), Math.abs(box.bottom - middle))
        if (distance < nearest) {
          nearest = distance
          best = Number(section.dataset.page)
        }
      })
      if (best < 0) return
      setCurrent((was) => {
        if (was !== best) changed.current?.(best)
        return best
      })
    }
    const soon = () => {
      if (!frame) frame = requestAnimationFrame(settle)
    }
    soon()
    document.addEventListener('scroll', soon, { capture: true, passive: true })
    window.addEventListener('resize', soon)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('scroll', soon, { capture: true })
      window.removeEventListener('resize', soon)
    }
  }, [pages.length, width])

  const count = pages.length
  const title = String(doc?.title || '').trim()

  return (
    <div ref={rootRef} className={cx('ds-root', 'ds-viewer', className || '')}>
      <div className="ds-viewer__bar">
        <span className="ds-viewer__count">{count === 1 ? '1 page' : `${count} pages`}</span>
        {count ? (
          <button type="button" className="ds-viewer__present" onClick={() => presentRef.current?.open(current)}>
            Present
          </button>
        ) : null}
      </div>
      <div ref={listRef} className="ds-viewer__pages" aria-label={title || undefined}>
        {pages.map((page, index) => (
          <section key={index} data-page={index} className="ds-viewer__page" aria-label={`Page ${index + 1} of ${count}`}>
            {width ? <SlideView page={page} maxWidth={width} maxHeight={Number.POSITIVE_INFINITY} /> : null}
          </section>
        ))}
      </div>
      <PresentStage ref={presentRef} pages={pages} currentPage={() => current} container={() => rootRef.current} />
    </div>
  )
}
