import { useEffect, useRef } from 'react'
import Guides from '@scena/guides'
import { subscribeSelector } from '@/store/subscribe'
import { canvasState, controlState, widgetState } from '@/store/state'
import { updateGuidelines } from '@/store/canvas'
import getSnapPositions from '@/common/methods/snapping'
import useTheme from '@/common/hooks/useTheme'
import './lineGuides.less'

const container = 'page-design'

/**
 * A guide sits within a couple of pixels of an object's edge either way, so the
 * pull has to be gentle enough that you can still place one deliberately.
 */
const GUIDE_SNAP_THRESHOLD = 5

export default function LineGuides({ show }: { show: boolean }) {
  const { resolved } = useTheme()
  const guidesTop = useRef<any>(null)
  const guidesLeft = useRef<any>(null)
  const resizeObserver = useRef<ResizeObserver | null>(null)
  const lastSnaps = useRef({ x: '', y: '' })

  function token(name: string, fallback: string) {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return value || fallback
  }

  /** The zero of both rulers is the top-left corner of the page. */
  function alignToPage() {
    if (!guidesTop.current || !guidesLeft.current) return
    const zoom = canvasState.dZoom / 100
    if (!zoom) return

    const canvasEl = document.getElementById('page-design-canvas')
    const topEl = document.querySelector('.my-horizontal') as HTMLElement | null
    const leftEl = document.querySelector('.my-vertical') as HTMLElement | null
    if (!canvasEl || !topEl || !leftEl) return

    // The page is CSS-scaled, so its measured rect already carries the zoom —
    // which is exactly the mapping the rulers need, and it stays right whatever
    // the transform-origin happens to be at this zoom level.
    const page = canvasEl.getBoundingClientRect()
    const topRect = topEl.getBoundingClientRect()
    const leftRect = leftEl.getBoundingClientRect()

    // Both rulers draw a value at `(value - scrollPos) * zoom` from their own
    // origin, so the offset wanted is simply the gap to the page, unscaled.
    const topRuler = topEl.querySelector('canvas') as HTMLElement | null
    const leftRuler = leftEl.querySelector('canvas') as HTMLElement | null
    // The guide layer is a separate box, tucked past the ruler gutter.
    const topGuides = topEl.querySelector('.scena-guides') as HTMLElement | null
    const leftGuides = leftEl.querySelector('.scena-guides') as HTMLElement | null

    guidesTop.current.scroll((topRect.left + (topRuler?.offsetLeft ?? 0) - page.left) / zoom)
    guidesTop.current.scrollGuides((topRect.top + (topGuides?.offsetTop ?? 0) - page.top) / zoom)
    guidesLeft.current.scroll((leftRect.top + (leftRuler?.offsetTop ?? 0) - page.top) / zoom)
    guidesLeft.current.scrollGuides((leftRect.left + (leftGuides?.offsetLeft ?? 0) - page.left) / zoom)
  }

  /** Feeds the rulers the object edges a dragged guide should stick to. */
  function updateSnaps() {
    if (!guidesTop.current || !guidesLeft.current) return
    const positions = controlState.dSnapEnabled
      ? getSnapPositions(widgetState.dWidgets, canvasState.dPage)
      : { x: [], y: [] }
    // A guide can only sit on a whole pixel, so offer it whole pixels.
    const x = [...new Set(positions.x.map(Math.round))]
    const y = [...new Set(positions.y.map(Math.round))]
    // Assigning re-renders the ruler, and the layers change on every keystroke
    // in a text box, so only hand over a list that is actually different.
    if (y.join() !== lastSnaps.current.y) {
      lastSnaps.current.y = y.join()
      guidesTop.current.snaps = y
    }
    if (x.join() !== lastSnaps.current.x) {
      lastSnaps.current.x = x.join()
      guidesLeft.current.snaps = x
    }
  }

  function changeScroll() {
    if (!guidesTop.current || !guidesLeft.current) return
    const zoom = canvasState.dZoom / 100
    guidesTop.current.zoom = zoom
    guidesLeft.current.zoom = zoom
    if (zoom < 0.9) {
      guidesTop.current.unit = Math.floor(1 / zoom) * 50
      guidesLeft.current.unit = Math.floor(1 / zoom) * 50
    } else {
      guidesTop.current.unit = 50
      guidesLeft.current.unit = 50
    }
    updateSnaps()
    alignToPage()
    // The page finishes moving after a zoom change, so measure again once it has.
    setTimeout(alignToPage, 300)
  }

  function destroy() {
    resizeObserver.current?.disconnect()
    resizeObserver.current = null
    window.removeEventListener('resize', changeScroll)
    guidesTop.current?.destroy()
    guidesLeft.current?.destroy()
    guidesTop.current = null
    guidesLeft.current = null
    lastSnaps.current.x = ''
    lastSnaps.current.y = ''
  }

  function render() {
    const sameParams = {
      backgroundColor: token('--ds-ruler-bg', '#f3f8fa'),
      lineColor: token('--ds-ruler-line', '#acbac1'),
      textColor: token('--ds-ruler-text', '#75838a'),
      displayDragPos: true,
      dragPosFormat: (v: string | number) => v + 'px',
      snapThreshold: GUIDE_SNAP_THRESHOLD,
    }

    const containerEl = document.getElementById(container)
    if (!containerEl) return

    // The top ruler measures x; the guides you pull out of it are horizontal
    // lines, so their positions are y values. The left ruler is the mirror image.
    guidesTop.current = new Guides(containerEl, {
      ...sameParams,
      type: 'horizontal',
      className: 'my-horizontal',
      // Rebuilt from scratch on a theme change; the guides survive it.
      defaultGuides: [...canvasState.guidelines.horizontalGuidelines],
    } as any).on('changeGuides', (e: any) => {
      updateGuidelines({ horizontalGuidelines: e.guides })
    })

    guidesLeft.current = new Guides(containerEl, {
      ...sameParams,
      type: 'vertical',
      className: 'my-vertical',
      defaultGuides: [...canvasState.guidelines.verticalGuidelines],
    } as any).on('changeGuides', (e: any) => {
      updateGuidelines({ verticalGuidelines: e.guides })
    })

    // The page is centred in whatever space the panels leave, so its position
    // moves when the window does — and with it where the rulers read zero.
    window.addEventListener('resize', changeScroll)
    const pageDesignEl = document.getElementById('page-design')
    if (pageDesignEl && typeof ResizeObserver !== 'undefined') {
      resizeObserver.current = new ResizeObserver(() => changeScroll())
      resizeObserver.current.observe(pageDesignEl)
    }

    changeScroll()
  }

  const wasShown = useRef<boolean | null>(null)
  useEffect(() => {
    if (show) {
      wasShown.current = true
      render()
      return destroy
    }
    destroy()
    // Hidden guides that objects still stuck to would be baffling, so putting
    // the rulers away puts the guides away with them. Only on the way out
    // though: this effect also runs on mount and on a theme change, and a
    // design's saved guides are not ours to throw away.
    if (wasShown.current) {
      updateGuidelines({ verticalGuidelines: [], horizontalGuidelines: [] })
    }
    wasShown.current = false
    return undefined
  }, [show, resolved])

  useEffect(
    () =>
      subscribeSelector(
        canvasState,
        () => [canvasState.dZoom, canvasState.dPage.width, canvasState.dPage.height],
        () => changeScroll(),
      ),
    [],
  )

  // What a dragged guide sticks to is whatever is on the page, so keep the list
  // in step with the layers.
  useEffect(
    () =>
      subscribeSelector(
        widgetState,
        () => widgetState.dWidgets.map((item) => `${item.uuid}:${item.left},${item.top},${item.width},${item.height}`).join('|'),
        () => updateSnaps(),
      ),
    [],
  )

  useEffect(() => subscribeSelector(controlState, () => controlState.dSnapEnabled, () => updateSnaps()), [])

  return <div />
}
