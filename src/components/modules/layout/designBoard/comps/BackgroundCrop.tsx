import { useCallback, useEffect, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import Slider from '@/components/ui/Slider'
import {
  DEFAULT_FOCUS,
  MAX_SCALE,
  MIN_SCALE,
  backgroundTransformOf,
  pageBackgroundStyle,
  type TBackgroundTransform,
} from '@/common/methods/pageBackground'
import type { TPageState } from '@/store/types'
import './backgroundCrop.less'

type Props = {
  page: TPageState
  onChange: (transform: TBackgroundTransform) => void
}

/** The preview is the page in miniature, so it fits a box rather than fills one. */
const MAX_BOX_WIDTH = 224
const MAX_BOX_HEIGHT = 168
/** How far one arrow-key press walks the picture, as a share of what is hidden. */
const NUDGE = 2

const clamp = (value: number) => Math.min(100, Math.max(0, value))

function fitBox(width: number, height: number) {
  const scale = Math.min(MAX_BOX_WIDTH / width, MAX_BOX_HEIGHT / height, 1)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

/**
 * Chooses which part of a background picture is on show.
 *
 * The preview is the page at a smaller size and is painted by the same code as
 * the canvas, so what you drag here is what you get there. Dragging moves the
 * picture under a fixed window: the distance the pointer travels is turned into
 * a share of however much of the picture is hidden, which is the only reason
 * this needs to know the picture's shape.
 */
export default function BackgroundCrop({ page, onChange }: Props) {
  const boxRef = useRef<HTMLDivElement | null>(null)
  const [dragging, setDragging] = useState(false)
  const [measured, setMeasured] = useState<number | undefined>(undefined)

  const stored = backgroundTransformOf(page)
  const ratio = stored.ratio || measured
  const box = fitBox(page.width, page.height)

  const latest = useRef({ ...stored, ratio })
  latest.current = { ...stored, ratio }

  // A picture set before this control existed — or uploaded, where the shape is
  // not part of the answer — has no shape recorded. Read it off the picture
  // itself, and let the first change the user makes write it down.
  useEffect(() => {
    if (stored.ratio || !page.backgroundImage) return
    let live = true
    const probe = new window.Image()
    probe.onload = () => {
      if (live && probe.naturalHeight) setMeasured(probe.naturalWidth / probe.naturalHeight)
    }
    probe.src = page.backgroundImage
    return () => {
      live = false
    }
  }, [page.backgroundImage, stored.ratio])

  const commit = useCallback(
    (next: Partial<TBackgroundTransform>) => {
      onChange({ ...latest.current, ...next })
    },
    [onChange],
  )

  /** How much of the picture hangs outside the page, in preview pixels. */
  const hidden = useCallback(() => {
    if (!ratio) return { x: 0, y: 0 }
    const wide = ratio > page.width / page.height
    const height = wide ? box.height * latest.current.scale : (box.width * latest.current.scale) / ratio
    const width = wide ? height * ratio : box.width * latest.current.scale
    return { x: Math.max(0, width - box.width), y: Math.max(0, height - box.height) }
  }, [box.height, box.width, page.height, page.width, ratio])

  const onPointerDown = (event: React.PointerEvent) => {
    if (!page.backgroundImage) return
    event.preventDefault()
    boxRef.current?.focus()

    const room = hidden()
    if (room.x <= 0 && room.y <= 0) return

    const from = { x: latest.current.x, y: latest.current.y }
    const startX = event.clientX
    const startY = event.clientY
    setDragging(true)

    // Dragging right pulls the picture right, which brings its left side into
    // view — a smaller position percentage. Hence the subtraction.
    const move = (e: PointerEvent) => {
      commit({
        x: room.x > 0 ? clamp(from.x - ((e.clientX - startX) / room.x) * 100) : from.x,
        y: room.y > 0 ? clamp(from.y - ((e.clientY - startY) / room.y) * 100) : from.y,
      })
    }
    const up = () => {
      setDragging(false)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step: Record<string, [number, number]> = {
      ArrowLeft: [NUDGE, 0],
      ArrowRight: [-NUDGE, 0],
      ArrowUp: [0, NUDGE],
      ArrowDown: [0, -NUDGE],
    }
    const move = step[event.key]
    if (!move) return
    event.preventDefault()
    commit({ x: clamp(latest.current.x + move[0]), y: clamp(latest.current.y + move[1]) })
  }

  const room = hidden()
  const movable = room.x > 0 || room.y > 0
  const changed = stored.x !== DEFAULT_FOCUS || stored.y !== DEFAULT_FOCUS || stored.scale !== MIN_SCALE

  return (
    <div className="background-crop">
      <div
        ref={boxRef}
        className={`background-crop__page${movable ? ' is-movable' : ''}${dragging ? ' is-dragging' : ''}`}
        style={{ ...pageBackgroundStyle(page), width: box.width, height: box.height }}
        aria-label="Background position — drag, or use the arrow keys"
        tabIndex={0}
        onPointerDown={onPointerDown}
        onKeyDown={onKeyDown}
      />
      <p className="background-crop__hint">
        {movable ? 'Drag the picture to choose what shows.' : 'Zoom in to choose which part of the picture shows.'}
      </p>
      <div className="background-crop__zoom">
        <span className="label">Zoom</span>
        <Slider
          className="background-crop__slider"
          value={stored.scale}
          min={MIN_SCALE}
          max={MAX_SCALE}
          step={0.01}
          disabled={!ratio}
          onChange={(value) => commit({ scale: value })}
        />
        <span className="value">{Math.round(stored.scale * 100)}%</span>
      </div>
      <Button
        className="background-crop__reset"
        text
        size="small"
        disabled={!changed}
        onClick={() => commit({ x: DEFAULT_FOCUS, y: DEFAULT_FOCUS, scale: MIN_SCALE })}
      >
        Reset position
      </Button>
    </div>
  )
}
