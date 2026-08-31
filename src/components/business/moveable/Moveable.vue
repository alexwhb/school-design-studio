<!--
 * @Author: ShawnPhang
 * @Date: 2021-08-04 11:46:39
 * @Description: 原版movable插件
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2025-01-10 03:38:49
-->
<template>
  <div id="empty" class="moveable__remove-item zk-moveable-style"></div>
</template>
<script lang="ts" setup>
import { nextTick, onMounted, watch } from 'vue'

import Moveable, { EVENTS } from 'moveable' // PROPERTIES, METHODS,
import MoveableHelper from 'moveable-helper'
// import { setTransformAttribute } from '@/common/methods/handleTransform'
import useSelecto from './Selecto'
import { storeToRefs } from 'pinia'
import { useCanvasStore, useControlStore, useWidgetStore, useForceStore, useHistoryStore } from '@/store'
import getSnapPositions, { snapBox } from '@/common/methods/snapping'

const widgetStore = useWidgetStore()
const controlStore = useControlStore()
const canvasStore = useCanvasStore()
const forceStore = useForceStore()
const historyStore = useHistoryStore()
const { guidelines } = storeToRefs(canvasStore)
const { showMoveable, showRotatable, dAltDown, dSnapEnabled } = storeToRefs(controlStore)
const { dSelectWidgets, dActiveElement, activeMouseEvent, dWidgets } = storeToRefs(widgetStore)
const { updateRect, updateSelect } = storeToRefs(forceStore)

let _target: string | null = null

/**
 * How close, in screen pixels, an edge has to come before it is pulled into
 * line. Adobe XD sits around here: close enough to feel eager, loose enough
 * that you can still put something a few pixels off deliberately.
 */
const SNAP_THRESHOLD = 5

/**
 * How far, in screen pixels, the tidy-up after a drag may move something. Well
 * under SNAP_THRESHOLD on purpose — see tidySnappedPosition.
 */
const SNAP_TIDY_PX = 1.5

/** One thing Moveable can align against, and which of its lines count. */
type TElementGuideline = {
  element: Element
  top?: boolean
  left?: boolean
  right?: boolean
  bottom?: boolean
}

watch(
  () => dActiveElement.value,
  async (val) => {
    setTimeout(async () => {
      await nextTick()
      checkMouseEvent()
    }, 10);
    if (!val || !val.record) {
      return
    }
    if (!moveable) return
    // 选中非面板 并且不是组合内的元素
    if (Number(val.uuid) != -1) {
      await nextTick()
      const target = `[id="${val.uuid}"]`
      _target = `[id="${val.uuid}"]`
      moveable.rotatable = true // Selecting cancels the rotation handle
      // 方向点位设置
      // this.moveable.renderDirections = val.type === 'w-text' ? ['e', 'se'] : 'w-image' ? ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] : ['nw', 'ne', 'sw', 'se']
      switch (val.type) {
        case 'w-text':
          moveable.renderDirections = ['e', 'se']
          break
        case 'w-image':
          moveable.renderDirections = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
          break
        case 'w-svg':
          moveable.renderDirections = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
          break
        default:
          moveable.renderDirections = ['nw', 'ne', 'sw', 'se']
          break
      }
      // // Set Move Auto
      moveable.setState({ target: _target }, () => {
        // 当出现mouseevent时进行即刻选中
        checkMouseEvent()
      })
      // // End
      controlStore.setShowMoveable(true)
      // store.commit('setShowMoveable', true)
      // Everything else on the page becomes something to align against
      buildElementGuidelines()
    } else {
      moveable.target = `[id="empty"]`
      if (moveable.target !== `[id="empty"]`) {
        setTimeout(() => {
          if (!moveable) return
          moveable.target = `[id="empty"]`
        }, 210)
      }
      buildElementGuidelines()
    }
  }
)

watch(
  () => showMoveable.value,
  (val) => {
    if (!moveable) return
    if (val) {
        moveable.target = _target
      } else {
        moveable.target = `[id="empty"]`
      }
  }
)

watch(
  () => showRotatable.value,
  (val) => {
    if (!moveable) return
    // TODO: 这里是通过旋转来判断是否可以操作
    moveable.renderDirections = val ? ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] : []
    moveable.resizable = val
    // this.moveable.scalable = val
    const el = document.getElementsByClassName('moveable-rotation')
    if (el && el[0]) {
      (el[0] as HTMLElement).style.display = val ? 'block' : 'none'
    }
  }
)

watch(
  () => updateRect.value,
  () => {
    moveable && moveable.updateRect()
  }
)

watch(
  () => updateSelect.value,
  () => {
    const items = widgetStore.dSelectWidgets
    setTimeout(async () => {
      if (!moveable) return
      moveable.updateRect()
      await nextTick()
      for (let i = 0; i < items.length; i++) {
        console.log(items[i].uuid)
        document.getElementById(items[i].uuid)?.classList.add('widget-selected')
      }
      moveable.renderDirections = []
      moveable.rotatable = false
      const targetCollector = [].slice.call(document.querySelectorAll('.widget-selected'))
      console.log(targetCollector)

      moveable.target = targetCollector
      for (let i = 0; i < items.length; i++) {
        document.getElementById(items[i].uuid)?.classList.remove('widget-selected')
      }
    }, 400)
  }
)

/** 选择的元素 */
watch(
  () => dSelectWidgets.value,
  (items) => {
    if (!moveable) return
    const alt = dAltDown.value
    // if (items.length > 1) {
    //   console.log('打开组合面板')
    // }
    if (alt) {
      for (let i = 0; i < items.length; i++) {
        document.getElementById(items[i].uuid)?.classList.add('widget-selected')
      }
      moveable.renderDirections = []
      moveable.rotatable = false
      const targetCollector = [].slice.call(document.querySelectorAll('.widget-selected'))
      // this.moveable.target = `[id="empty"]`
      moveable.target = targetCollector
      for (let i = 0; i < items.length; i++) {
        document.getElementById(items[i].uuid)?.classList.remove('widget-selected')
      }
    }
    // A multi-selection moves as one, so none of it aligns to the rest of itself
    buildElementGuidelines()
  },
  { deep: true }
)

/**
 * Ruler guides.
 *
 * Moveable's own verticalGuidelines/horizontalGuidelines are measured in the
 * container's screen pixels, which is the wrong space here — the page is
 * CSS-scaled by the zoom. designBoard renders an invisible box inside the page
 * for each guide instead, and those get measured like any other object.
 */
watch(
  () => guidelines.value,
  async () => {
    await nextTick()
    buildElementGuidelines()
  },
  { deep: true }
)

/** Adding or deleting a layer changes what there is to align against. */
watch(
  () => dWidgets.value.map((item: any) => item.uuid).join(),
  async () => {
    await nextTick()
    buildElementGuidelines()
  }
)

/** Snapping is a preference, and it is allowed to be off. */
watch(
  () => dSnapEnabled.value,
  (enabled) => {
    if (!moveable) return
    moveable.snappable = enabled
  }
)

/**
 * Hands Moveable everything worth aligning to: the page itself — which is where
 * snapping to the centre of the canvas comes from — every other top-level
 * layer, and the ruler guides. The selection is left out, or it would snap to
 * where it already is.
 *
 * Only the list of elements is set here; Moveable re-measures them when a drag
 * starts, so this does not need to run as things move.
 */
function buildElementGuidelines() {
  if (!moveable) return
  const canvas = document.getElementById('page-design-canvas')
  if (!canvas) {
    moveable.elementGuidelines = []
    return
  }

  const selected = new Set<string>()
  dSelectWidgets.value.forEach((item: any) => item?.uuid && selected.add(item.uuid))
  const active = dActiveElement.value?.uuid
  if (active && active !== '-1') selected.add(active)

  const values: TElementGuideline[] = [{ element: canvas }]

  canvas.querySelectorAll(':scope > .layer').forEach((el) => {
    const uuid = el.getAttribute('data-uuid')
    if (uuid && selected.has(uuid)) return
    values.push({ element: el })
  })

  // A guide is a line, not a box: suppress the edges of the stand-in that lie
  // across it, which would otherwise duplicate the edges of the page.
  // In this version of Moveable `top`/`bottom` name the vertical lines an
  // element contributes and `left`/`right` the horizontal ones, not its sides.
  canvas.querySelectorAll('.snap-guide-v').forEach((element) => {
    values.push({ element, left: false, right: false })
  })
  canvas.querySelectorAll('.snap-guide-h').forEach((element) => {
    values.push({ element, top: false, bottom: false })
  })

  moveable.elementGuidelines = values
}

/**
 * Puts a dragged layer exactly on the line it snapped to.
 *
 * Moveable rounds its guides to a tenth of a screen pixel, and its own drag
 * distance to a whole one, so a snapped edge can still land a fraction out —
 * at 25% zoom that fraction is four times as large in page coordinates, and it
 * is what you see when you zoom back in. The correction taken is the smallest
 * one available and far tighter than Moveable's own threshold, so it can only
 * finish the snap that happened, never start a different one.
 */
function tidySnappedPosition(position: { left: number; top: number }) {
  const widget = dActiveElement.value
  // Rotated layers snap against their turned bounds, which is not the box this
  // works from; leave those to Moveable.
  if (!dSnapEnabled.value || !widget || (widget.rotate && parseFloat(String(widget.rotate)) !== 0)) {
    return position
  }
  const zoom = canvasStore.dZoom / 100
  if (!zoom) return position
  const positions = getSnapPositions(dWidgets.value, canvasStore.dPage, {
    exclude: widget.uuid,
    guides: guidelines.value,
  })
  return snapBox({ left: position.left, top: position.top, width: Number(widget.width), height: Number(widget.height) }, positions, SNAP_TIDY_PX / zoom)
}

type TMoveableOptions = {
  target: HTMLElement | null
  container?:  HTMLElement | null
  zoom: number
  draggable: boolean
  clippable: boolean // Crop
  throttleDrag: number
  resizable: boolean
  throttleResize: number
  scalable: boolean
  throttleScale: number
  keepRatio: boolean
  rotatable: boolean
  throttleRotate: number
  renderDirections: string[] // ['nw', 'ne', 'sw', 'se'] // 'e'
  pinchable: boolean // ["draggable", "resizable", "scalable", "rotatable"]
  origin: boolean
  defaultGroupOrigin: string,
  /* 样式相关 */
  rotationPosition: 'bottom',
  className: 'zk-moveable-style',
  /* -- 吸附对齐 Start -- */
  snappable: boolean,
  elementGuidelines: TElementGuideline[],
  snapThreshold: number,
  isDisplaySnapDigit: boolean,
  snapGap: boolean,
  snapElement: boolean,
  snapVertical: boolean,
  snapHorizontal: boolean,
  snapCenter: boolean,
  snapDigit: number

  // snapDirections={{"top":true,"right":true,"bottom":true,"left":true}}
  //       elementSnapDirections={{}}
  // -- END --
  triggerAblesSimultaneously: true,
}

let moveable: Moveable | null = null
let holdPosition: { left: number, top: number } | null = null
let startHL: number = 0
let startLS: number = 0
let resetRatio: number = 0
let resizeTempData: { width: number, height: number } | null = null

onMounted(() => {
  let holdGroupPosition: Record<string, any> | null = null
  const moveableOptions: TMoveableOptions = {
    target: document.querySelector(`[id="empty"]`),
    // container: document.querySelector('#page-design'),
    zoom: 0.8,
    draggable: true,
    clippable: false, // Crop
    throttleDrag: 0,
    resizable: true,
    throttleResize: 0,
    scalable: false,
    throttleScale: 0,
    keepRatio: true,
    rotatable: true,
    throttleRotate: 0,
    renderDirections: ['nw', 'ne', 'sw', 'se'], // ['nw', 'ne', 'sw', 'se'] // 'e'
    pinchable: true, // ["draggable", "resizable", "scalable", "rotatable"]
    origin: false,
    defaultGroupOrigin: '0% 0%',
    // 样式相关
    rotationPosition: 'bottom',
    className: 'zk-moveable-style',
    // -- 吸附对齐 Start --
    snappable: dSnapEnabled.value,
    elementGuidelines: [],
    snapThreshold: SNAP_THRESHOLD,
    isDisplaySnapDigit: true,
    // Equal-spacing hints: drag a third object between two and it holds the gap
    snapGap: true,
    snapElement: true,
    snapVertical: true,
    snapHorizontal: true,
    // Centre-to-centre and middle-to-middle, which is most of what makes this
    // feel like a design tool rather than a grid
    snapCenter: true,
    snapDigit: 0,

    // snapDirections={{"top":true,"right":true,"bottom":true,"left":true}}
    //       elementSnapDirections={{}}
    // -- END --
    triggerAblesSimultaneously: true,
  }

  // moveable = new Moveable(document.body, moveableOptions)
  const containerEl = document.querySelector('#main') as HTMLElement | SVGElement;
  moveable = new Moveable(containerEl, moveableOptions)

  const helper = new MoveableHelper()

  EVENTS.forEach((event) => {
    let helperEvent = (event.replace(event[0], 'on' + event[0].toUpperCase()) as keyof MoveableHelper)
    // console.log(event)
    // 'resizeStart', 'resize', 'resizeEnd', rotate, onScale, onScaleStart
    if (['resizeStart', 'rotate', 'resize'].includes(event)) {
      moveable?.on(event as any, (...args) => {
        // this.$emit(event, ...args)
        if (helper[helperEvent] && typeof helper[helperEvent] === "function") {
          (helper[helperEvent] as Function)(...args)
        }
      })
    }
  })

  /* draggable */
  let resizeStartWidth = 0

  moveable
  .on('dragStart', ({ inputEvent, target, stop }) => {
    if (!dActiveElement.value) return
    if (inputEvent.target.nodeName === 'PRE') {
      dActiveElement.value.editable && stop()
    }
    dActiveElement.value.lock && stop()
  })
  .on('drag', ({ target, transform, left, top, inputEvent }) => {
    // target!.style.transform = transform]
    target!.style.left = `${left}px`
    target!.style.top = `${top}px`
    holdPosition = { left, top }
  })
  .on('dragEnd', ({ target, isDrag, inputEvent }) => {
    // console.log('onDragEnd', inputEvent)
    // TODO 清理mouseevent
    widgetStore.setMouseEvent(null)
    // store.commit('setMouseEvent', null)

    inputEvent.stopPropagation()
    inputEvent.preventDefault()
    // console.log(this.holdPosition, inputEvent.pageX, inputEvent.pageY)
    if (holdPosition) {
      holdPosition = tidySnappedPosition(holdPosition)
      target!.style.left = `${holdPosition.left}px`
      target!.style.top = `${holdPosition.top}px`
      widgetStore.updateWidgetData({
        uuid: dActiveElement.value?.uuid || "",
        key: 'left',
        value: Number(holdPosition?.left),
      })
      // store.dispatch("updateWidgetData", {
      //   uuid: dActiveElement.value.uuid,
      //   key: 'left',
      //   value: Number(holdPosition?.left),
      // })

      widgetStore.updateWidgetData({
        uuid: dActiveElement.value?.uuid || "",
        key: 'top',
        value: Number(holdPosition?.top),
      })
      // store.dispatch("updateWidgetData", {
      //   uuid: dActiveElement.value.uuid,
      //   key: 'top',
      //   value: Number(holdPosition?.top),
      // })

      holdPosition = null // important
    }
  })
  // .on('keyUp', (e) => {
  //   moveable.updateRect()
  // })
  .on('rotate', ({ target, beforeDist, dist, transform }: any) => {
    // console.log('onRotate', Number(this.dActiveElement.rotate) + Number(beforeDist + dist))
    target.style.transform = transform
    target.style.height = dActiveElement.value?.height + 'px' // Correct the text height
  })
  .on('rotateEnd', (e: any) => {
    const tf = e.target.style.transform
    const iof = tf.indexOf('rotate')
    let rotate = ''
    if (iof != -1) {
      const index = iof + 'rotate'.length
      const half = tf.substring(index + 1)
      rotate = half.slice(0, half.indexOf(')'))
    }
    rotate && widgetStore.updateWidgetData({
      uuid: dActiveElement.value?.uuid || "",
      key: 'rotate',
      value: rotate,
    })

    // rotate &&
    //   store.dispatch("updateWidgetData", {
    //     uuid: dActiveElement.value.uuid,
    //     key: 'rotate',
    //     value: rotate,
    //   })
  })
  .on('resizeStart', (args) => {
    console.log(args.target.style.transform)
    if (!moveable) return

    if (dActiveElement.value?.type === 'w-text') {
      if (String(args.direction) === '1,0') {
        moveable.keepRatio = false
        moveable.scalable = false
      }
      if (String(args.direction) === '1,1') {
        moveable.keepRatio = false
        resizeStartWidth = (args.target as HTMLElement).offsetWidth
        startHL = Number(args.target!.style.lineHeight.replace('px', ''))
        startLS = Number(args.target!.style.letterSpacing.replace('px', ''))
        resetRatio = 1
      }
    } else if (dActiveElement.value?.type === 'w-image' || dActiveElement.value?.type === 'w-qrcode' || dActiveElement.value?.type === 'w-svg') {
      const dirs = ['1,0', '0,-1', '-1,0', '0,1']
      dirs.includes(String(args.direction)) && (moveable.keepRatio = false)
    }
  })
  .on('resize', (args: any) => {
    const { target, width, height, dist, delta, clientX, clientY, direction } = args
    if (dActiveElement.value?.type === 'w-text') {
      if (String(direction) === '1,1') {
        resetRatio = width / resizeStartWidth
        target!.style.fontSize = (dActiveElement.value?.fontSize || 0) * resetRatio + 'px'
        target!.style.letterSpacing = startLS * resetRatio + 'px'
        target!.style.lineHeight = startHL * resetRatio + 'px'
      }
      target.style.width = width
      target.style.height = height
      resizeTempData = { width, height }
      // moveable.updateRect()
      target.style.backgroundImage = 'none'
      // moveable.keepRatio !== this.resetRatio > 1 && (moveable.keepRatio = this.resetRatio > 1)
    } else if (dActiveElement.value?.type == 'w-image' || dActiveElement.value?.type === 'w-qrcode' || dActiveElement.value?.type === 'w-svg') {
      resizeTempData = { width, height }
    } else if (dActiveElement.value?.type == 'w-group') {
      // let record = this.dActiveElement.record
      // this.dActiveElement.tempScale = width / record.width

      widgetStore.resize({ width: width, height: height })
      // store.commit('resize', { width: width, height: height })

      // this.resizeTempData = { width, height }
      // let record = this.dActiveElement.record
      // setTransformAttribute(target, 'scale', width / record.width)
    } else {
      widgetStore.resize({ width: width, height: height })
      // store.commit('resize', { width: width, height: height })
    }
    dActiveElement.value?.rotate && (target!.style.transform = target!.style.transform.replace('(0deg', `(${dActiveElement.value?.rotate}`))
  })
  .on('resizeEnd', (e: any) => {
    if (!moveable) return
    moveable.resizable = true
    // moveable.scalable = true
    moveable.snappable = dSnapEnabled.value
    if (e.lastEvent) {
      // setTimeout(() => {
      // if (this.dActiveElement.type === 'w-group') {
      //   // 临时屏蔽，抖得太严重
      //   return
      // }
      console.log('reset translate', dActiveElement.value)
      // 转换成位置
      // if (this.dActiveElement.cache && this.dActiveElement.cache.recordLeft) {
      //   const left = e.lastEvent.drag.translate[0] + Number(this.dActiveElement.cache.recordLeft)
      //   const top = e.lastEvent.drag.translate[1] + Number(this.dActiveElement.cache.recordTop)
      //   this.dActiveElement.cache = { left, top }
      // } else {
      //   const left = e.lastEvent.drag.translate[0] + Number(this.dActiveElement.left)
      //   const top = e.lastEvent.drag.translate[1] + Number(this.dActiveElement.top)
      //   this.dActiveElement.cache = { left, top }
      // }
      const left = e.lastEvent.drag.translate[0]
      const top = e.lastEvent.drag.translate[1]
      widgetStore.updateWidgetMultiple({
        uuid: dActiveElement.value?.uuid || "",
        data: [
          {
            key: 'left',
            value: Number(dActiveElement.value?.left) + left,
          },
          {
            key: 'top',
            value: Number(dActiveElement.value?.top) + top,
          },
        ],
      })
      // store.dispatch("updateWidgetMultiple", {
      //   uuid: dActiveElement.value.uuid,
      //   data: [
      //     {
      //       key: 'left',
      //       value: Number(dActiveElement.value.left) + left,
      //     },
      //     {
      //       key: 'top',
      //       value: Number(dActiveElement.value.top) + top,
      //     },
      //   ],
      // })
      // 重置translate
      const tf = e.target.style.transform
      const iof = tf.indexOf('translate')
      const FRONT = tf.slice(0, iof + 'translate'.length + 1)
      const half = tf.substring(iof + 'translate'.length + 1)
      const END = half.substring(half.indexOf(')'))
      e.target.style.transform = FRONT + '0, 0' + END
      // this.moveable.updateRect()
      // }, 10)
    }
    if (resizeTempData) {
      widgetStore.resize(resizeTempData)
      // store.commit('resize', resizeTempData)

      resizeTempData = null
      // await this.$nextTick()
      moveable.updateRect()
      // 临时处理缩放后细线问题 https://github.com/palxiao/poster-design/issues/75
      controlStore.setShowMoveable(false)
      // store.commit('setShowMoveable', false)
      setTimeout(() => {
        controlStore.setShowMoveable(true)
        // store.commit('setShowMoveable', true)
      }, 10);
    }
    try {
      if (dActiveElement.value?.type === 'w-text') {
        const d = e.direction || e.lastEvent.direction
        String(d) === '1,1' && (dActiveElement.value.fontSize = Number(dActiveElement.value?.fontSize) * resetRatio)
      }
    } catch (err) {}
    moveable.keepRatio = true
  })
  .on('scaleStart', (e) => {
    if (dActiveElement.value?.type === 'w-text') {
      startHL = Number(e.target!.style.lineHeight.replace('px', ''))
      startLS = Number(e.target!.style.letterSpacing.replace('px', ''))
      resetRatio = 1
    } else {
      if (!moveable) return
      moveable.scalable = false
    }
  })
  .on('scale', (e) => {
    if (!moveable) return
    moveable.resizable = false
    const { target, scale, transform } = e
    resetRatio = scale[0]
    target!.style.transform = transform
    dActiveElement.value?.rotate && (target!.style.transform = target!.style.transform.replace('0deg', dActiveElement.value.rotate))
  })
  .on('scaleEnd', (e: any) => {
    if (!moveable) return
    moveable.resizable = true
    // moveable.scalable = true
    moveable.keepRatio = true
    console.log(e.target.style.transform)
    try {
      if (dActiveElement.value?.type === 'w-text') {
        const d = e.direction || e.lastEvent.direction
        String(d) === '1,1' && (dActiveElement.value.fontSize = Number(dActiveElement.value.fontSize) * resetRatio)
      }
    } catch (err) {}
  })
  .on('dragGroup', (e) => {
    e.inputEvent.stopPropagation()
    e.inputEvent.preventDefault()
    holdGroupPosition = {}
    const events = e.events
    for (let i = 0; i < events.length; i++) {
      const ev = events[i]
      const currentWidget = dWidgets.value.find((item: any) => item.uuid === ev.target.getAttribute('data-uuid'))
      const left = Number(currentWidget?.left) + ev.beforeTranslate[0]
      // debug -- start --
      if (i === 1) {
        console.log(Number(currentWidget?.left), ev.beforeTranslate[0])
      }
      // debug -- end --
      const top = Number(currentWidget?.top) + ev.beforeTranslate[1]
      ev.target.style.left = `${left}px`
      ev.target.style.top = `${top}px`
      holdGroupPosition[`${ev.target.getAttribute('data-uuid')}`] = { left, top }
    }
  })
  .on('dragGroupEnd', (e) => {
    for (const key in holdGroupPosition) {
      if (Object.prototype.hasOwnProperty.call(holdGroupPosition, key)) {
        const item = holdGroupPosition[key]
        widgetStore.updateWidgetData({
          uuid: key,
          key: 'left',
          value: item.left,
        })
        widgetStore.updateWidgetData({
          uuid: key,
          key: 'top',
          value: item.top,
        })
        // store.dispatch("updateWidgetData", {
        //   uuid: key,
        //   key: 'top',
        //   value: item.top,
        // })
      }
    }
    holdGroupPosition = null
    // background: linear-gradient(to right, #ccc 0%, #ccc 50%, transparent 50%);
    // background-size: 12px 1px;
  })
  .on('resizeGroupStart', ({ events }: any) => {
    console.log(events)
    // events.forEach((ev, i) => {
    //     const frame = this.frames[i];
    //     // Set origin if transform-origin use %.
    //     ev.setOrigin(["%", "%"]);

    //     // If cssSize and offsetSize are different, set cssSize.
    //     const style = window.getComputedStyle(ev.target);
    //     const cssWidth = parseFloat(style.width);
    //     const cssHeight = parseFloat(style.height);
    //     ev.set([cssWidth, cssHeight]);

    //     // If a drag event has already occurred, there is no dragStart.
    //     ev.dragStart && ev.dragStart.set(frame.translate);
    // });
  })
  .on('resizeGroup', (e: any) => {
    // events.forEach(({ target, width, height, drag }, i) => {
    //     const frame = this.frames[i];
    //     target.style.width = `${width}px`;
    //     target.style.height = `${height}px`;
    //     // get drag event
    //     frame.translate = drag.beforeTranslate;
    //     target.style.transform
    //         = `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px)`;
    // });
  })
  .on('resizeGroupEnd', ({ targets, isDrag }: any) => {
    console.log('onResizeGroupEnd', targets, isDrag)
  })

  // -- 选择功能 Start --
  useSelecto(moveable)
  // -- 选择功能 END --

})

async function created() {
  await nextTick()
  const Ele = document.getElementById('main')
  // 后续可能加个节流 TODO
  Ele?.addEventListener('scroll', () => {
    if (!moveable) return
    moveable.updateRect()
  })
}

created()

// ...mapActions(['updateWidgetData', 'updateWidgetMultiple', 'pushHistory']),
function checkMouseEvent() {
  if (activeMouseEvent.value && moveable) {
    moveable.dragStart(activeMouseEvent.value)
    // 使用后销毁mouseevent
    widgetStore.setMouseEvent(null)
    // store.commit('setMouseEvent', null)
  }
}
</script>

<style lang="less">
@import url('./style/index.less');
</style>