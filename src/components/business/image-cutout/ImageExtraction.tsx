import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import NumberSlider from '@/components/modules/settings/NumberSlider'
import { Matting } from '@/packages/image-extraction/matting'
import {
  HARDNESS_SLIDER_MAX,
  HARDNESS_SLIDER_MIN,
  HARDNESS_SLIDER_STEP,
  RADIUS_SLIDER_MAX,
  RADIUS_SLIDER_MIN,
  RADIUS_SLIDER_STEP,
} from '@/packages/image-extraction/constants'
import { watchEffect } from '@/packages/image-extraction/reactivity'
import { cx } from '@/utils/dom'
import './imageExtraction.less'

export type ImageExtractionHandle = {
  open: (raw: string, result: string, done: (base64: string) => void) => void
}

/**
 * The brush-based eraser, in a dialog.
 *
 * Two boards side by side: the picture with the mask painted over it, and the
 * result. The engine owns both canvases once they mount — see
 * packages/image-extraction/matting.ts — and this only reads back what has to
 * be drawn in React: the brush cursor, and the slider values.
 */
const ImageExtraction = forwardRef<ImageExtractionHandle, {}>(function ImageExtraction(_props, ref) {
  const [show, setShow] = useState(false)
  const [isErasing, setIsErasing] = useState(false)
  const [radius, setRadius] = useState(RADIUS_SLIDER_MIN)
  const [hardness, setHardness] = useState(HARDNESS_SLIDER_MIN)
  /*
   * The dialog is portalled, and Radix mounts its content a tick after `show`
   * turns true — so the boards are held in state rather than refs, and the
   * engine starts when they actually exist rather than when they were asked for.
   */
  const [boards, setBoards] = useState<{ input: HTMLCanvasElement; output: HTMLCanvasElement } | null>(null)
  const inputRef = useRef<HTMLCanvasElement | null>(null)
  const outputRef = useRef<HTMLCanvasElement | null>(null)
  const cursorsRef = useRef<(HTMLImageElement | null)[]>([])

  const settleBoards = useCallback(() => {
    const input = inputRef.current
    const output = outputRef.current
    setBoards((previous) => {
      if (!input || !output) return previous === null ? previous : null
      if (previous && previous.input === input && previous.output === output) return previous
      return { input, output }
    })
  }, [])

  const takeInput = useCallback(
    (el: HTMLCanvasElement | null) => {
      inputRef.current = el
      settleBoards()
    },
    [settleBoards],
  )
  const takeOutput = useCallback(
    (el: HTMLCanvasElement | null) => {
      outputRef.current = el
      settleBoards()
    },
    [settleBoards],
  )
  const matting = useRef<Matting | null>(null)
  const pending = useRef<{ raw: string; result: string } | null>(null)
  const callback = useRef<((base64: string) => void) | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      open(raw, result, done) {
        pending.current = { raw, result }
        callback.current = done
        setShow(true)
      },
    }),
    [],
  )

  useEffect(() => {
    if (!show || !boards) return
    const { input, output } = boards

    const engine = new Matting()
    matting.current = engine
    engine.mount(input, output)
    setRadius(engine.radius.value)
    setHardness(engine.hardness.value)
    setIsErasing(engine.isErasing.value)

    // The brush follows the pointer, so its position is written straight to the
    // two <img> elements rather than through state: a re-render per mousemove is
    // the one thing a drawing tool cannot afford.
    const stopCursor = watchEffect(() => {
      const src = engine.cursorImage.value
      const style = engine.cursorStyle as Record<string, string | undefined>
      for (const img of cursorsRef.current) {
        if (!img) continue
        if (src && img.getAttribute('src') !== src) img.setAttribute('src', src)
        img.style.left = style.left ?? ''
        img.style.top = style.top ?? ''
        img.style.display = style.display ?? 'none'
      }
    })

    // The dialog animates in, so the boards are measured once it has settled.
    const settle = setTimeout(() => {
      engine.remeasure()
      if (pending.current) void engine.open(pending.current.raw, pending.current.result)
    }, 320)

    return () => {
      stopCursor()
      clearTimeout(settle)
      engine.destroy()
      matting.current = null
    }
  }, [show, boards])

  function setBrush(erasing: boolean) {
    setIsErasing(erasing)
    if (matting.current) matting.current.isErasing.value = erasing
  }

  function done() {
    const result = matting.current?.getResult() || ''
    setShow(false)
    callback.current?.(result)
  }

  return (
    <Dialog
      open={show}
      onOpenChange={setShow}
      width="90%"
      className="ds-image-extraction"
      title={
        <div className="tool-wrap">
          <Button type="primary" plain onClick={done}>
            Apply
          </Button>
          <div className="brushes">
            <label className={cx('brush', { 'is-on': !isErasing })}>
              <input type="radio" checked={!isErasing} onChange={() => setBrush(false)} />
              <b>Restore brush</b> <i className="icon sd-xiubu" />
            </label>
            <label className={cx('brush', { 'is-on': isErasing })}>
              <input type="radio" checked={isErasing} onChange={() => setBrush(true)} />
              <b>Erase brush</b> <i className="icon sd-cachu" />
            </label>
          </div>
          <NumberSlider
            className="slider-wrap"
            label="Brush size"
            value={radius}
            minValue={RADIUS_SLIDER_MIN}
            maxValue={RADIUS_SLIDER_MAX}
            step={RADIUS_SLIDER_STEP}
            onChange={(value) => {
              setRadius(value)
              if (matting.current) matting.current.radius.value = value
            }}
          />
          <NumberSlider
            className="slider-wrap"
            label="Softness"
            value={hardness}
            minValue={HARDNESS_SLIDER_MIN}
            maxValue={HARDNESS_SLIDER_MAX}
            step={HARDNESS_SLIDER_STEP}
            onChange={(value) => {
              setHardness(value)
              if (matting.current) matting.current.hardness.value = value
            }}
          />
        </div>
      }
    >
      <div className="board-container">
        <div className="matting-wrapper">
          <canvas ref={takeInput} className="matting-board" />
          <img ref={(el) => { cursorsRef.current[0] = el }} className="matting-cursor" alt="" />
        </div>
        <div className="matting-wrapper">
          <canvas ref={takeOutput} className="result-board" />
          <img ref={(el) => { cursorsRef.current[1] = el }} className="matting-cursor" alt="" />
        </div>
      </div>
    </Dialog>
  )
})

export default ImageExtraction
