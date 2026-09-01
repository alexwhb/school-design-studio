/**
 * The eraser engine, driven imperatively.
 *
 * Upstream's `@palxp/image-extraction` was a Vue component plus four
 * composables over 1,300 lines of framework-free canvas geometry. The geometry
 * is copied here unchanged; this file replaces the composables, keeping the same
 * refs and the same watchers so the helpers below cannot tell the difference.
 *
 * It owns no DOM of its own. A view hands it the two canvases and reads back
 * `cursorImage` and `cursorStyle`; everything else is the engine's business.
 */
import { computed, reactive, ref, shallowRef, type Ref } from '@vue/reactivity'
import { debounce } from 'throttle-debounce'
import {
  ERASE_POINT_INNER_COLOR,
  ERASE_POINT_OUTER_COLOR,
  DEFAULT_MASK_COLOR,
  EventType,
  HARDNESS_ZOOM_TO_SLIDER_RATIO,
  INITIAL_HARDNESS,
  INITIAL_RADIUS,
  INITIAL_TRANSFORM_CONFIG,
  RADIUS_TO_BRUSH_SIZE_RATIO,
  REPAIR_POINT_INNER_COLOR,
  REPAIR_POINT_OUTER_COLOR,
  UPDATE_BOARDRECT_DEBOUNCE_TIME,
} from './constants'
import { createContext2D, drawBrushPoint, generateResultImageURL, getLoadedImage, resizeCanvas, transformedDrawImage } from './helpers/dom-helper'
import { computeBoardRect } from './helpers/init-compute'
import { initMatting } from './helpers/init-matting'
import { initDrawingListeners } from './helpers/init-drawing-listeners'
import { initDragListener, initScaleListener } from './helpers/init-transform-listener'
import ListenerManager from './helpers/listener-manager'
import { watch, watchEffect, type StopHandle } from './reactivity'
import iconEraser from './assets/eraser.png'
import type { BoardRect, TransformConfig } from './types/common'
import type { CursorStyle } from './types/cursor'
import type { DrawingCircularConfig } from './types/dom'
import type { ImageSources, InitMattingResult } from './types/init-matting'

export type MattingCursorStyle = CursorStyle

export class Matting {
  readonly picFile: Ref<File | null> = shallowRef(null)
  readonly isErasing = ref(false)
  readonly radius = ref(INITIAL_RADIUS)
  readonly hardness = ref(INITIAL_HARDNESS)
  readonly initialized = ref(false)
  readonly cursorImage = ref<string>('')
  readonly cursorStyle = reactive(Object.create(null)) as MattingCursorStyle

  readonly brushSize = computed(() => this.radius.value * RADIUS_TO_BRUSH_SIZE_RATIO)
  readonly hardnessText = computed(() => `${Math.round(this.hardness.value * HARDNESS_ZOOM_TO_SLIDER_RATIO)}%`)

  private width = ref(0)
  private height = ref(0)
  private inputCtx: Ref<CanvasRenderingContext2D | null> = shallowRef(null)
  private outputCtx: Ref<CanvasRenderingContext2D | null> = shallowRef(null)
  private inputHiddenCtx: Ref<CanvasRenderingContext2D> = shallowRef(createContext2D())
  private outputHiddenCtx: Ref<CanvasRenderingContext2D> = shallowRef(createContext2D())
  private inputDrawingCtx: CanvasRenderingContext2D = createContext2D()
  private outputDrawingCtx: CanvasRenderingContext2D = createContext2D()
  private initMattingResult: Ref<InitMattingResult | null> = shallowRef(null)
  private mattingSources: Ref<ImageSources | null> = shallowRef(null)
  private boardRect: Ref<BoardRect | null> = shallowRef(null)
  private draggingInputBoard = ref(false)
  private isDrawing = ref(false)
  private transformConfig = reactive({ ...INITIAL_TRANSFORM_CONFIG }) as TransformConfig
  private listenerManager = new ListenerManager()

  private cursorCtx: CanvasRenderingContext2D = document.createElement('canvas').getContext('2d') as CanvasRenderingContext2D
  private stops: StopHandle[] = []
  private onResize = () => this.resizeBoards()
  private onScroll = debounce(UPDATE_BOARDRECT_DEBOUNCE_TIME, () => this.updateBoardRect())

  private get boardContexts() {
    return {
      inputCtx: this.inputCtx,
      outputCtx: this.outputCtx,
      inputDrawingCtx: this.inputDrawingCtx,
      outputDrawingCtx: this.outputDrawingCtx,
      inputHiddenCtx: this.inputHiddenCtx,
      outputHiddenCtx: this.outputHiddenCtx,
    }
  }

  /** Binds to the two canvases and starts watching. Call once, after they mount. */
  mount(input: HTMLCanvasElement, output: HTMLCanvasElement) {
    this.inputCtx.value = input.getContext('2d')
    this.outputCtx.value = output.getContext('2d')
    this.width.value = input.clientWidth
    this.height.value = input.clientHeight

    this.stops.push(watch([this.picFile], () => void this.load()))
    this.stops.push(
      watchEffect(() => {
        if (!this.initialized.value) return
        initDrawingListeners({
          listenerManager: this.listenerManager,
          imageSources: this.mattingSources.value as ImageSources,
          boardContexts: this.boardContexts,
          initDrawingConfig: { radius: this.radius, hardness: this.hardness, transformConfig: this.transformConfig },
          isErasing: this.isErasing.value,
          draggingInputBoard: this.draggingInputBoard.value,
          boardRect: this.boardRect.value as BoardRect,
        })
      }),
    )
    this.stops.push(
      watch(
        [this.initialized, this.draggingInputBoard, this.isDrawing],
        () => {
          if (!this.initialized.value || this.isDrawing.value) return
          const initConfig = {
            inputContexts: { ctx: this.inputCtx.value as CanvasRenderingContext2D, hiddenCtx: this.inputHiddenCtx.value },
            outputContexts: { ctx: this.outputCtx.value as CanvasRenderingContext2D, hiddenCtx: this.outputHiddenCtx.value },
            draggingInputBoard: this.draggingInputBoard.value,
            listenerManager: this.listenerManager,
            transformConfig: this.transformConfig,
          }
          initDragListener(initConfig)
          initScaleListener(initConfig)
          // Rebinding the drawing listeners has to wait until the drag ends, or
          // they would be laid over the drag listeners and win.
          if (!this.draggingInputBoard.value) {
            this.transformConfig.positionRange = { ...this.transformConfig.positionRange }
          }
        },
        { deep: true },
      ),
    )
    this.stops.push(
      watch([this.transformConfig], () => {
        if (!this.initialized.value) return
        const { positionRange, scaleRatio } = this.transformConfig
        transformedDrawImage({ ctx: this.inputCtx.value as CanvasRenderingContext2D, hiddenCtx: this.inputHiddenCtx.value, positionRange, scaleRatio })
        transformedDrawImage({
          ctx: this.outputCtx.value as CanvasRenderingContext2D,
          hiddenCtx: this.outputHiddenCtx.value,
          withBorder: true,
          positionRange,
          scaleRatio,
        })
      }),
    )
    this.stops.push(
      watchEffect(() => {
        void this.updateCursorImage(this.radius.value, this.hardness.value, this.isErasing.value)
      }),
    )
    this.stops.push(watch([this.draggingInputBoard], () => (this.cursorStyle.display = this.draggingInputBoard.value ? 'none' : 'initial')))

    window.addEventListener(EventType.Resize, this.onResize)
    window.addEventListener('scroll', this.onScroll)
    this.bindCursor(input)
  }

  destroy() {
    for (const stop of this.stops) stop()
    this.stops = []
    window.removeEventListener(EventType.Resize, this.onResize)
    window.removeEventListener('scroll', this.onScroll)
    const input = this.inputCtx.value?.canvas
    const output = this.outputCtx.value?.canvas
    if (input) this.listenerManager.removeMouseListeners(input)
    if (output) this.listenerManager.removeMouseListeners(output)
    this.listenerManager.removeWheelListeners()
  }

  /**
   * Opens `source` for erasing, with `result` as the starting mask.
   *
   * Handing the original in as its own mask means "everything is kept", which is
   * the right place to start erasing from.
   */
  async open(source: string, result: string) {
    const response = await fetch(source)
    const blob = await response.blob()
    this.picFile.value = new File([blob], `image_${Math.random()}.jpg`, { type: 'image/jpeg' })
    this.pendingMask = result
  }

  /** The finished cut-out as a data URL, or '' if there is nothing to give back. */
  getResult(): string {
    if (!this.mattingSources.value) return ''
    return generateResultImageURL(this.mattingSources.value.orig, this.outputHiddenCtx.value) || ''
  }

  private pendingMask = ''

  private async load() {
    const file = this.picFile.value
    if (!file || !this.width.value || !this.height.value) return
    this.initialized.value = false
    this.initMattingResult.value = await initMatting({
      boardContexts: this.boardContexts,
      picFile: file,
      targetSize: { width: this.width.value, height: this.height.value },
      transformConfig: {},
      imageSources: {},
    })
    const { raw, mask, orig, positionRange, scaleRatio } = this.initMattingResult.value
    this.transformConfig.positionRange = positionRange
    this.transformConfig.scaleRatio = scaleRatio
    this.mattingSources.value = { raw, mask, orig }
    this.updateBoardRect()
    this.resizeBoards()
    this.initialized.value = true
    if (this.pendingMask) await this.applyMask(this.pendingMask)
  }

  /**
   * Seeds the boards from a previous pass, so a second go touches up rather than
   * starting again. Anything opaque in `result` is what was kept, and that is
   * painted back as the mask.
   */
  private async applyMask(result: string) {
    const image = await getLoadedImage(result)
    this.outputHiddenCtx.value.drawImage(image, 0, 0)

    const canvas = document.createElement('canvas')
    canvas.width = image.width
    canvas.height = image.height
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(image, 0, 0)
    const imageData = ctx.getImageData(0, 0, image.width, image.height)
    const data = imageData.data
    const [r, g, b, a] = DEFAULT_MASK_COLOR
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] > 0) {
        data[i] = r * 255
        data[i + 1] = g * 255
        data[i + 2] = b * 255
        // Lighter than the mask proper, so the kept area reads as a tint rather
        // than a fill.
        data[i + 3] = (a - 0.15) * 255
      }
    }
    this.inputDrawingCtx.putImageData(imageData, 0, 0)
    this.inputHiddenCtx.value.drawImage(this.inputDrawingCtx.canvas, 0, 0)
    // Nudge the transform so both boards repaint from the hidden canvases.
    this.transformConfig.scaleRatio += 0.0001
    this.transformConfig.scaleRatio -= 0.0001
  }

  private updateBoardRect() {
    const canvas = this.inputCtx.value?.canvas
    if (canvas) this.boardRect.value = computeBoardRect(canvas)
  }

  private resizeBoards() {
    requestAnimationFrame(() => {
      const input = this.inputCtx.value
      const output = this.outputCtx.value
      if (!input || !output) return
      const commonConfig = { targetHeight: this.height.value, targetWidth: this.width.value, transformConfig: this.transformConfig }
      resizeCanvas({ ctx: input, hiddenCtx: this.inputHiddenCtx.value, ...commonConfig })
      resizeCanvas({ ctx: output, hiddenCtx: this.outputHiddenCtx.value, withBorder: true, ...commonConfig })
    })
  }

  /** Re-measures after the dialog has settled at its final size. */
  remeasure() {
    const canvas = this.inputCtx.value?.canvas
    if (!canvas) return
    this.width.value = canvas.clientWidth
    this.height.value = canvas.clientHeight
    this.updateBoardRect()
    this.resizeBoards()
  }

  private bindCursor(target: HTMLCanvasElement) {
    target.addEventListener(EventType.Mouseover, () => (this.cursorStyle.display = 'initial'))
    target.addEventListener(EventType.Mouseout, () => (this.cursorStyle.display = 'none'))
    target.addEventListener(EventType.Mousemove, (e) => {
      const event = e as MouseEvent
      this.cursorStyle.left = event.offsetX - this.radius.value + 'px'
      this.cursorStyle.top = event.offsetY - this.radius.value + 'px'
    })
  }

  private async updateCursorImage(radius: number, hardness: number, isErasing: boolean) {
    const ctx = this.cursorCtx
    ctx.canvas.width = radius * 2
    ctx.canvas.height = radius * 2
    const drawingConfig: DrawingCircularConfig = {
      ctx,
      x: radius,
      y: radius,
      radius,
      hardness,
      innerColor: isErasing ? ERASE_POINT_INNER_COLOR : REPAIR_POINT_INNER_COLOR,
      outerColor: isErasing ? ERASE_POINT_OUTER_COLOR : REPAIR_POINT_OUTER_COLOR,
    }
    drawBrushPoint(drawingConfig)
    if (isErasing) {
      const eraser = await getLoadedImage(iconEraser)
      ctx.drawImage(eraser, 0, 0, radius * 2, radius * 2)
    }
    this.cursorImage.value = ctx.canvas.toDataURL()
  }
}
