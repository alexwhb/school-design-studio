import { useEffect } from 'react'
import { subscribeKey } from 'valtio/utils'
import { subscribeSelector } from '@/store/subscribe'
import MoveableClass, { EVENTS } from 'moveable'
import MoveableHelper from 'moveable-helper'
import { canvasState, controlState, forceState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { resize } from '@/store/widget/resize'
import { updateWidgetData, updateWidgetMultiple } from '@/store/widget/widget'
import { clearSelection, selectWidget } from '@/store/widget/select'
import { beginHistory, endHistory } from '@/common/hooks/history'
import { refuseLocked } from '@/store/widget/lock'
import type { TdWidgetData } from '@/store/types'
import useSelecto, { isBoxingSelection } from './Selecto'
import getSnapPositions, { snapBox } from '@/common/methods/snapping'
import './style/index.less'

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

/**
 * Rotation. Shift turns in steps of ROTATE_STEP; without it, the angles that
 * matter most — square, and the diagonals — pull the handle in from within
 * ROTATE_MAGNET_RANGE degrees, gently enough that 43° is still there for the
 * asking.
 */
const ROTATE_STEP = 15
const ROTATE_MAGNET = 45
const ROTATE_MAGNET_RANGE = 2

function snapRotation(angle: number, shift: boolean) {
  if (shift) return Math.round(angle / ROTATE_STEP) * ROTATE_STEP
  const nearest = Math.round(angle / ROTATE_MAGNET) * ROTATE_MAGNET
  return Math.abs(angle - nearest) <= ROTATE_MAGNET_RANGE ? nearest : angle
}

/**
 * The handles a multi-selection gets: corners only, so everything in it scales
 * together and keeps its shape. A side handle would have to stretch each layer
 * a different amount — a heading and a photograph do not distort alike — and
 * Canva does not offer one either.
 */
const GROUP_DIRECTIONS = ['nw', 'ne', 'sw', 'se']

/** What a layer looked like when a multi-selection resize began. */
type TScaleStart = {
  left: number
  top: number
  width: number
  height: number
  fontSize?: number
  children: { uuid: string; left: number; top: number; width: number; height: number; fontSize?: number }[]
}

function scaleStartOf(widget: TdWidgetData): TScaleStart {
  const box = (item: TdWidgetData) => ({
    uuid: item.uuid,
    left: Number(item.left),
    top: Number(item.top),
    width: Number(item.width),
    height: Number(item.height),
    fontSize: typeof item.fontSize === 'number' ? item.fontSize : undefined,
  })
  const own = box(widget)
  return {
    ...own,
    children: widget.isContainer ? widgetState.dWidgets.filter((item) => item.parent === widget.uuid).map(box) : [],
  }
}

/**
 * Puts a layer down scaled by `ratio` from where it started, with its top-left
 * corner at the place Moveable worked out for it. Type scales with its box, or
 * the words would only wrap differently; a group's members are laid out again
 * inside it, at the same ratio, from where they sat relative to its corner.
 */
function applyScaled(widget: TdWidgetData, start: TScaleStart, ratio: number, left: number, top: number) {
  widget.left = left
  widget.top = top
  widget.width = start.width * ratio
  widget.height = start.height * ratio
  if (typeof start.fontSize === 'number') widget.fontSize = start.fontSize * ratio
  for (const child of start.children) {
    const item = widgetState.dWidgets.find((w) => w.uuid === child.uuid)
    if (!item) continue
    item.left = left + (child.left - start.left) * ratio
    item.top = top + (child.top - start.top) * ratio
    item.width = child.width * ratio
    item.height = child.height * ratio
    if (typeof child.fontSize === 'number') item.fontSize = child.fontSize * ratio
  }
}

/** One thing Moveable can align against, and which of its lines count. */
type TElementGuideline = {
  element: Element
  top?: boolean
  left?: boolean
  right?: boolean
  bottom?: boolean
}

export default function Moveable() {
  useEffect(() => {
    let moveable: any = null
    let _target: string | null = null
    let holdPosition: { left: number; top: number } | null = null
    let holdGroupPosition: Record<string, any> | null = null
    let startHL = 0
    let startLS = 0
    let resetRatio = 0
    let resizeTempData: { width: number; height: number } | null = null
    let resizeStartWidth = 0
    /** Where every layer of a multi-selection was when its corner was picked up. */
    let groupResizeStart: Map<string, TScaleStart> | null = null
    /** A locked layer was pulled: say so once, when it is let go. */
    let lockedDragAttempt = false
    /** See drawActiveTarget: the delayed insistence that nothing is selected. */
    let emptyTimer: any = null

    const moveableOptions = {
      target: document.querySelector(`[id="empty"]`),
      zoom: 0.8,
      draggable: true,
      clippable: false,
      throttleDrag: 0,
      resizable: true,
      throttleResize: 0,
      scalable: false,
      throttleScale: 0,
      keepRatio: true,
      rotatable: true,
      throttleRotate: 0,
      renderDirections: ['nw', 'ne', 'sw', 'se'],
      pinchable: true,
      origin: false,
      defaultGroupOrigin: '0% 0%',
      rotationPosition: 'bottom',
      className: 'zk-moveable-style',
      snappable: controlState.dSnapEnabled,
      elementGuidelines: [] as TElementGuideline[],
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
      triggerAblesSimultaneously: true,
    }

    /**
     * Hands Moveable everything worth aligning to: the page itself — which is
     * where snapping to the centre of the canvas comes from — every other
     * top-level layer, and the ruler guides. The selection is left out, or it
     * would snap to where it already is.
     *
     * Only the list of elements is set here; Moveable re-measures them when a
     * drag starts, so this does not need to run as things move.
     */
    function buildElementGuidelines() {
      if (!moveable) return
      const canvas = document.getElementById('page-design-canvas')
      if (!canvas) {
        moveable.elementGuidelines = []
        return
      }

      const selected = new Set<string>()
      widgetState.dSelectWidgets.forEach((item) => item?.uuid && selected.add(item.uuid))
      const active = widgetState.dActiveElement?.uuid
      if (active && active !== '-1') selected.add(active)

      const values: TElementGuideline[] = [{ element: canvas }]

      canvas.querySelectorAll(':scope > .layer').forEach((el) => {
        const uuid = el.getAttribute('data-uuid')
        if (uuid && selected.has(uuid)) return
        values.push({ element: el })
      })

      // A guide is a line, not a box: suppress the edges of the stand-in that
      // lie across it, which would otherwise duplicate the edges of the page.
      // In this version of Moveable `top`/`bottom` name the vertical lines an
      // element contributes and `left`/`right` the horizontal ones, not its sides.
      canvas.querySelectorAll('.snap-guide-v').forEach((element) => {
        values.push({ element, left: false, right: false })
      })
      canvas.querySelectorAll('.snap-guide-h').forEach((element) => {
        values.push({ element, top: false, bottom: false })
      })

      // The grid's lines, when it is on. Stand-ins inside the page for the same
      // reason the guides have them, and suppressed the same way: a grid line
      // is a line, not a box.
      canvas.querySelectorAll('.grid-snap-v').forEach((element) => {
        values.push({ element, left: false, right: false })
      })
      canvas.querySelectorAll('.grid-snap-h').forEach((element) => {
        values.push({ element, top: false, bottom: false })
      })

      moveable.elementGuidelines = values
    }

    /**
     * Stops drawing boxes round layers that have been deleted.
     *
     * Moveable holds the elements themselves, not their uuids, so a target that
     * has left the page keeps its box until something hands over a new one. A
     * single selection is covered by dActiveElement changing as it goes, but a
     * drag-selection is deleted with the page already active, so that never
     * fires and the whole template's worth of boxes stays on screen.
     *
     * The store is what says a layer has gone: this runs as dWidgets changes,
     * which is before React has taken the elements out of the DOM.
     */
    function dropDeletedTargets() {
      if (!moveable) return
      const target = moveable.target
      const live = new Set(widgetState.dWidgets.map((item) => item.uuid))
      const isGone = (el: Element) => {
        const uuid = el?.getAttribute?.('data-uuid')
        return !el?.isConnected || (!!uuid && !live.has(uuid))
      }

      if (Array.isArray(target)) {
        const kept = target.filter((el: Element) => !isGone(el))
        if (kept.length === target.length) return
        if (!kept.length) _target = `[id="empty"]`
        moveable.target = kept.length ? kept : `[id="empty"]`
        return
      }

      if (typeof target === 'string' && target !== `[id="empty"]`) {
        const el = document.querySelector(target)
        if (el && !isGone(el)) return
        _target = `[id="empty"]`
        moveable.target = `[id="empty"]`
      }
    }

    /**
     * Puts a dragged layer exactly on the line it snapped to.
     *
     * Moveable rounds its guides to a tenth of a screen pixel, and its own drag
     * distance to a whole one, so a snapped edge can still land a fraction out —
     * at 25% zoom that fraction is four times as large in page coordinates, and
     * it is what you see when you zoom back in. The correction taken is the
     * smallest one available and far tighter than Moveable's own threshold, so
     * it can only finish the snap that happened, never start a different one.
     */
    function tidySnappedPosition(position: { left: number; top: number }) {
      const widget = widgetState.dActiveElement
      // Rotated layers snap against their turned bounds, which is not the box
      // this works from; leave those to Moveable.
      if (!controlState.dSnapEnabled || !widget || (widget.rotate && parseFloat(String(widget.rotate)) !== 0)) {
        return position
      }
      const zoom = canvasState.dZoom / 100
      if (!zoom) return position
      const positions = getSnapPositions(widgetState.dWidgets, canvasState.dPage, {
        exclude: widget.uuid,
        guides: canvasState.guidelines,
        grid: controlState.dShowGrid ? controlState.dGridSize : 0,
      })
      return snapBox({ left: position.left, top: position.top, width: Number(widget.width), height: Number(widget.height) }, positions, SNAP_TIDY_PX / zoom)
    }

    /**
     * The angle, shown beside the pointer while the handle is being dragged.
     * Moveable has a readout for snap distances but none for rotation, and a
     * turn is the one transform you cannot judge from the box alone.
     */
    let rotateReadout: HTMLElement | null = null
    function showRotateReadout(angle: number, inputEvent?: MouseEvent) {
      if (!inputEvent) return
      if (!rotateReadout) {
        rotateReadout = document.createElement('div')
        rotateReadout.className = 'ds-rotate-readout'
        document.body.appendChild(rotateReadout)
      }
      const shown = Math.round(((angle % 360) + 360) % 360)
      rotateReadout.textContent = `${shown}°`
      rotateReadout.style.left = `${inputEvent.clientX + 14}px`
      rotateReadout.style.top = `${inputEvent.clientY + 14}px`
    }
    function hideRotateReadout() {
      rotateReadout?.remove()
      rotateReadout = null
    }

    const containerEl = document.querySelector('#main') as HTMLElement
    if (!containerEl) return
    moveable = new MoveableClass(containerEl, moveableOptions as any)

    const helper = new MoveableHelper()

    EVENTS.forEach((event: string) => {
      const helperEvent = event.replace(event[0], 'on' + event[0].toUpperCase())
      if (['resizeStart', 'rotate', 'resize'].includes(event)) {
        moveable?.on(event as any, (...args: any[]) => {
          const handler = (helper as Record<string, any>)[helperEvent]
          if (typeof handler === 'function') {
            handler.apply(helper, args)
          }
        })
      }
    })

    function checkMouseEvent() {
      if (widgetState.activeMouseEvent && moveable) {
        moveable.dragStart(widgetState.activeMouseEvent)
        widgetState.activeMouseEvent = null
      }
    }

    moveable
      .on('dragStart', ({ inputEvent, stop }: any) => {
        const active = widgetState.dActiveElement
        if (!active) return
        if (inputEvent.target.nodeName === 'PRE') {
          active.editable && stop()
        }
        lockedDragAttempt = false
      })
      .on('drag', ({ target, left, top, dist }: any) => {
        // A locked layer is picked up like any other — the press is also how it
        // is selected — but it does not go anywhere. A press that turns into a
        // pull is an attempt to move it, and is answered when it ends.
        if (widgetState.dActiveElement?.lock) {
          if (Math.hypot(dist?.[0] || 0, dist?.[1] || 0) > 3) lockedDragAttempt = true
          return
        }
        target!.style.left = `${left}px`
        target!.style.top = `${top}px`
        holdPosition = { left, top }
      })
      .on('dragEnd', ({ inputEvent }: any) => {
        widgetState.activeMouseEvent = null
        if (lockedDragAttempt) {
          lockedDragAttempt = false
          refuseLocked([widgetState.dActiveElement], 'moved')
        }

        inputEvent.stopPropagation()
        inputEvent.preventDefault()
        if (holdPosition) {
          holdPosition = tidySnappedPosition(holdPosition)
          const target = document.getElementById(widgetState.dActiveElement?.uuid || '')
          if (target) {
            target.style.left = `${holdPosition.left}px`
            target.style.top = `${holdPosition.top}px`
          }
          updateWidgetData({
            uuid: widgetState.dActiveElement?.uuid || '',
            key: 'left',
            value: Number(holdPosition?.left),
          })
          updateWidgetData({
            uuid: widgetState.dActiveElement?.uuid || '',
            key: 'top',
            value: Number(holdPosition?.top),
          })
          holdPosition = null
        }
      })
      .on('rotateStart', ({ stop }: any) => {
        refuseLocked([widgetState.dActiveElement], 'turned') && stop()
      })
      .on('rotate', ({ target, transform, rotate, inputEvent }: any) => {
        const angle = snapRotation(rotate, !!inputEvent?.shiftKey)
        // The string Moveable hands over carries exactly this term, and rotateEnd
        // reads the angle back out of the style, so this is the one place to
        // put the snapped value.
        target.style.transform = angle === rotate ? transform : transform.replace(`rotate(${rotate}deg)`, `rotate(${angle}deg)`)
        target.style.height = widgetState.dActiveElement?.height + 'px'
        showRotateReadout(angle, inputEvent)
      })
      .on('rotateEnd', (e: any) => {
        hideRotateReadout()
        const tf = e.target.style.transform
        const iof = tf.indexOf('rotate')
        let rotate = ''
        if (iof != -1) {
          const index = iof + 'rotate'.length
          const half = tf.substring(index + 1)
          rotate = half.slice(0, half.indexOf(')'))
        }
        rotate &&
          updateWidgetData({
            uuid: widgetState.dActiveElement?.uuid || '',
            key: 'rotate',
            value: rotate,
          })
      })
      .on('resizeStart', (args: any) => {
        if (!moveable) return
        const active = widgetState.dActiveElement
        if (refuseLocked([active], 'resized')) {
          args.stop()
          return
        }
        if (active?.type === 'w-text') {
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
        } else if (active?.type === 'w-rect' || active?.type === 'w-ellipse' || active?.type === 'w-polygon' || active?.type === 'w-path') {
          // A drawn shape is whatever size it was drawn at: there is no artwork
          // inside it with a shape of its own to hold on to, so no handle on it
          // keeps the ratio — including the corners, which do everywhere else.
          moveable.keepRatio = false
        } else if (active?.type === 'w-image' || active?.type === 'w-qrcode' || active?.type === 'w-svg') {
          const dirs = ['1,0', '0,-1', '-1,0', '0,1']
          dirs.includes(String(args.direction)) && (moveable.keepRatio = false)
        } else if (active?.type === 'w-table') {
          // Only the width is the user's: the rows set the height.
          moveable.keepRatio = false
        }
      })
      .on('resize', (args: any) => {
        const { target, width, height, direction } = args
        const active = widgetState.dActiveElement
        if (active?.type === 'w-text') {
          if (String(direction) === '1,1') {
            resetRatio = width / resizeStartWidth
            target!.style.fontSize = (active?.fontSize || 0) * resetRatio + 'px'
            target!.style.letterSpacing = startLS * resetRatio + 'px'
            target!.style.lineHeight = startHL * resetRatio + 'px'
          }
          target.style.width = width
          target.style.height = height
          resizeTempData = { width, height }
          target.style.backgroundImage = 'none'
        } else if (active?.type == 'w-image' || active?.type === 'w-qrcode' || active?.type === 'w-svg') {
          resizeTempData = { width, height }
        } else if (active?.type == 'w-group') {
          resize({ width, height })
        } else {
          resize({ width, height })
        }
        active?.rotate && (target!.style.transform = target!.style.transform.replace('(0deg', `(${active?.rotate}`))
      })
      .on('resizeEnd', (e: any) => {
        if (!moveable) return
        moveable.resizable = true
        moveable.snappable = controlState.dSnapEnabled
        const active = widgetState.dActiveElement
        if (e.lastEvent) {
          const left = e.lastEvent.drag.translate[0]
          const top = e.lastEvent.drag.translate[1]
          updateWidgetMultiple({
            uuid: active?.uuid || '',
            data: [
              { key: 'left', value: Number(active?.left) + left },
              { key: 'top', value: Number(active?.top) + top },
            ],
          })
          const tf = e.target.style.transform
          const iof = tf.indexOf('translate')
          const FRONT = tf.slice(0, iof + 'translate'.length + 1)
          const half = tf.substring(iof + 'translate'.length + 1)
          const END = half.substring(half.indexOf(')'))
          e.target.style.transform = FRONT + '0, 0' + END
        }
        if (resizeTempData) {
          resize(resizeTempData)
          resizeTempData = null
          moveable.updateRect()
          setShowMoveable(false)
          setTimeout(() => {
            setShowMoveable(true)
          }, 10)
        }
        try {
          if (active?.type === 'w-text') {
            const d = e.direction || e.lastEvent.direction
            String(d) === '1,1' && (active.fontSize = Number(active?.fontSize) * resetRatio)
          }
        } catch (err) {}
        moveable.keepRatio = true
      })
      .on('scaleStart', (e: any) => {
        const active = widgetState.dActiveElement
        if (active?.type === 'w-text') {
          startHL = Number(e.target!.style.lineHeight.replace('px', ''))
          startLS = Number(e.target!.style.letterSpacing.replace('px', ''))
          resetRatio = 1
        } else {
          if (!moveable) return
          moveable.scalable = false
        }
      })
      .on('scale', (e: any) => {
        if (!moveable) return
        moveable.resizable = false
        const { target, scale, transform } = e
        resetRatio = scale[0]
        target!.style.transform = transform
        const active = widgetState.dActiveElement
        active?.rotate && (target!.style.transform = target!.style.transform.replace('0deg', active.rotate))
      })
      .on('scaleEnd', (e: any) => {
        if (!moveable) return
        moveable.resizable = true
        moveable.keepRatio = true
        try {
          const active = widgetState.dActiveElement
          if (active?.type === 'w-text') {
            const d = e.direction || e.lastEvent.direction
            String(d) === '1,1' && (active.fontSize = Number(active.fontSize) * resetRatio)
          }
        } catch (err) {}
      })
      .on('dragGroupStart', ({ stop }: any) => {
        refuseLocked(widgetState.dSelectWidgets, 'moved') && stop()
      })
      .on('dragGroup', (e: any) => {
        e.inputEvent.stopPropagation()
        e.inputEvent.preventDefault()
        holdGroupPosition = {}
        const events = e.events
        for (let i = 0; i < events.length; i++) {
          const ev = events[i]
          const currentWidget = widgetState.dWidgets.find((item) => item.uuid === ev.target.getAttribute('data-uuid'))
          const left = Number(currentWidget?.left) + ev.beforeTranslate[0]
          const top = Number(currentWidget?.top) + ev.beforeTranslate[1]
          ev.target.style.left = `${left}px`
          ev.target.style.top = `${top}px`
          holdGroupPosition[`${ev.target.getAttribute('data-uuid')}`] = { left, top }
        }
      })
      .on('dragGroupEnd', () => {
        for (const key in holdGroupPosition) {
          if (Object.prototype.hasOwnProperty.call(holdGroupPosition, key)) {
            const item = holdGroupPosition[key]
            updateWidgetData({ uuid: key, key: 'left', value: item.left })
            updateWidgetData({ uuid: key, key: 'top', value: item.top })
          }
        }
        holdGroupPosition = null
      })
      /**
       * A multi-selection scales as one. Moveable works out each layer's new
       * size and where its corner has moved to, about the selection box; the
       * store is written as it goes, the way a group drag is, so the layers
       * follow the handle rather than jumping when it is let go.
       *
       * Bracketed by hand: the handle is Moveable's, not the document's, so the
       * press that starts this is not one the history hook can see.
       */
      .on('resizeGroupStart', (e: any) => {
        if (refuseLocked(widgetState.dSelectWidgets, 'resized')) {
          e.stop()
          return
        }
        groupResizeStart = new Map()
        for (const ev of e.events) {
          const uuid = ev.target.getAttribute('data-uuid')
          const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
          if (uuid && widget) groupResizeStart.set(uuid, scaleStartOf(widget))
        }
        beginHistory()
      })
      .on('resizeGroup', (e: any) => {
        if (!groupResizeStart) return
        for (const ev of e.events) {
          const uuid = ev.target.getAttribute('data-uuid')
          const start = uuid && groupResizeStart.get(uuid)
          const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
          if (!start || !widget) continue
          const ratio = start.width ? ev.width / start.width : 1
          applyScaled(widget, start, ratio, start.left + ev.drag.beforeTranslate[0], start.top + ev.drag.beforeTranslate[1])
        }
      })
      .on('resizeGroupEnd', () => {
        if (!groupResizeStart) return
        groupResizeStart = null
        endHistory()
        requestAnimationFrame(() => moveable?.updateRect())
      })
      /**
       * Clicking inside a multi-selection picks out the one layer clicked, or
       * drops the selection when the click lands on bare canvas — which is what
       * clicking does everywhere else, and what a design tool does here.
       *
       * The group is dragged by an area laid over the whole selection, so these
       * clicks never reach the canvas underneath and the board's own handler
       * never sees them. Moveable reports what was under the pointer instead.
       */
      .on('clickGroup', ({ inputTarget }: any) => {
        const layer = (inputTarget as HTMLElement)?.closest?.('[data-uuid]')
        const uuid = layer?.getAttribute('data-uuid')
        if (!uuid || uuid === '-1') {
          clearSelection()
          return
        }
        // A layer inside a group is chosen as the group, the way clicking it is
        const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
        selectWidget({ uuid: widget && widget.parent !== '-1' ? String(widget.parent) : uuid })
      })

    // A drag box is let go: whatever it caught, or stopped catching, is now what
    // the selection is, and the box drawn round it is worked out from scratch.
    const selecto = useSelecto(moveable, { onBoxEnd: () => syncSelectionBox() })

    const onScroll = () => {
      if (!moveable) return
      moveable.updateRect()
    }
    const mainEl = document.getElementById('main')
    mainEl?.addEventListener('scroll', onScroll)

    /**
     * Draws the box round one layer, or round nothing when the page is what is
     * active. Both a change of active element and a selection coming back down
     * to one end up here, so the handles a single layer gets are described in
     * one place.
     */
    function drawActiveTarget(val: any) {
      if (!moveable) return
      // Whatever is drawn now outranks a pending order to draw nothing
      clearTimeout(emptyTimer)
      if (val && val.record && Number(val.uuid) != -1) {
        _target = `[id="${val.uuid}"]`
        // A locked layer keeps its box, drawn so that you can tell, and loses
        // the handles: there is nothing they could do.
        moveable.className = val.lock ? 'zk-moveable-style is-locked' : 'zk-moveable-style'
        moveable.rotatable = !val.lock
        switch (val.lock ? 'locked' : val.type) {
          case 'locked':
            moveable.renderDirections = []
            break
          case 'w-text':
            // The side handle sets how wide the text may run before it wraps,
            // which a curved run has no use for: its box is fitted to the arc
            // and would take the width straight back off you. The corner, which
            // scales the type, works on both.
            moveable.renderDirections = Number(val.curve) ? ['se'] : ['e', 'se']
            break
          case 'w-image':
            moveable.renderDirections = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
            break
          case 'w-svg':
          case 'w-rect':
          case 'w-ellipse':
          case 'w-polygon':
          case 'w-path':
            moveable.renderDirections = ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']
            break
          case 'w-table':
            // A table is as tall as its rows, so only its width can be dragged.
            moveable.renderDirections = ['w', 'e']
            break
          default:
            moveable.renderDirections = ['nw', 'ne', 'sw', 'se']
            break
        }
        moveable.setState({ target: _target }, () => {
          checkMouseEvent()
        })
        setShowMoveable(true)
      } else {
        _target = `[id="empty"]`
        moveable.target = `[id="empty"]`
        if (moveable.target !== `[id="empty"]`) {
          // Said again once Moveable has settled, in case it took the first one
          // while it was busy. Cancelled if something is selected in between —
          // a drag box can be pulled and let go well inside this wait.
          emptyTimer = setTimeout(() => {
            if (!moveable) return
            moveable.target = `[id="empty"]`
          }, 210)
        }
      }
      // Everything else on the page becomes something to align against
      buildElementGuidelines()
    }

    const unsubActive = subscribeKey(widgetState, 'dActiveElement', (val) => {
      setTimeout(() => {
        checkMouseEvent()
      }, 10)
      if (!val || !val.record) {
        return
      }
      drawActiveTarget(val)
    })

    const unsubShowMoveable = subscribeKey(controlState, 'showMoveable', (val) => {
      if (!moveable) return
      if (val) {
        moveable.target = _target
      } else {
        moveable.target = `[id="empty"]`
      }
    })

    const unsubShowRotatable = subscribeKey(controlState, 'showRotatable', (val) => {
      if (!moveable) return
      moveable.renderDirections = val ? ['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se'] : []
      moveable.resizable = val
      const el = document.getElementsByClassName('moveable-rotation')
      if (el && el[0]) {
        ;(el[0] as HTMLElement).style.display = val ? 'block' : 'none'
      }
    })

    const unsubUpdateRect = subscribeKey(forceState, 'updateRect', () => {
      moveable && moveable.updateRect()
    })

    const unsubUpdateSelect = subscribeKey(forceState, 'updateSelect', () => {
      const items = widgetState.dSelectWidgets
      setTimeout(() => {
        if (!moveable) return
        moveable.updateRect()
        for (let i = 0; i < items.length; i++) {
          document.getElementById(items[i].uuid)?.classList.add('widget-selected')
        }
        moveable.renderDirections = GROUP_DIRECTIONS
        moveable.rotatable = false
        const targetCollector = [].slice.call(document.querySelectorAll('.widget-selected'))
        moveable.target = targetCollector
        for (let i = 0; i < items.length; i++) {
          document.getElementById(items[i].uuid)?.classList.remove('widget-selected')
        }
      }, 400)
    })

    /**
     * Draws the box round what is selected: one box round the lot when there is
     * more than one layer, the single layer's own box when there is one, and
     * none at all when the selection has been dropped.
     */
    function syncSelectionBox() {
      if (!moveable) return
      clearTimeout(emptyTimer)
      const items = widgetState.dSelectWidgets
      // What is selected is what says a group box is wanted, not which keys are
      // held: Ctrl/Cmd + A makes a multi-selection outright, and a modifier-click
      // that takes the last layer back out leaves one behind or none.
      if (items.length > 1) {
        // Selecto marks what a drag box caught and leaves the mark on; the marks
        // added here are only a way to gather the nodes, so they are taken off
        // again and anything already marked is left as it was found.
        const marked: HTMLElement[] = []
        for (let i = 0; i < items.length; i++) {
          const el = document.getElementById(items[i].uuid)
          if (!el || el.classList.contains('widget-selected')) continue
          el.classList.add('widget-selected')
          marked.push(el)
        }
        moveable.renderDirections = GROUP_DIRECTIONS
        moveable.rotatable = false
        moveable.keepRatio = true
        const targetCollector = [].slice.call(document.querySelectorAll('.widget-selected'))
        moveable.target = targetCollector
        marked.forEach((el) => el.classList.remove('widget-selected'))
        // A multi-selection moves as one, so none of it aligns to the rest of itself
        buildElementGuidelines()
        return
      }
      // The selection has come down to one layer or to none — clicking away,
      // Escape, or a modifier-click taking the last one back out. The box drawn
      // round the group is not taken down by anything else: the page is often
      // active already by the time this runs, so dActiveElement never changes
      // and the boxes would stay on screen with nothing left to move.
      //
      // Selecto marks what its drag box caught and leaves the mark on, which is
      // how the group was gathered; the marks and Selecto's own idea of what is
      // selected both have to go, or the next box drags the old layers along.
      document.querySelectorAll('.widget-selected').forEach((el) => el.classList.remove('widget-selected'))
      selecto.setSelectedTargets([])
      drawActiveTarget(items.length === 1 ? items[0] : widgetState.dActiveElement)
    }

    const unsubSelectWidgets = subscribeSelector(
      widgetState,
      () => widgetState.dSelectWidgets.map((item) => item.uuid).join(','),
      () => {
        // Mid-box the selection is still being gathered; Selecto is drawing the
        // box itself until it is let go, and onBoxEnd picks it up from there.
        if (isBoxingSelection()) return
        syncSelectionBox()
      },
    )

    /*
     * Ruler guides.
     *
     * Moveable's own verticalGuidelines/horizontalGuidelines are measured in the
     * container's screen pixels, which is the wrong space here — the page is
     * CSS-scaled by the zoom. DesignBoard renders an invisible box inside the
     * page for each guide instead, and those get measured like any other object.
     */
    const unsubGuides = subscribeSelector(
      canvasState,
      () => [canvasState.guidelines.verticalGuidelines.join(), canvasState.guidelines.horizontalGuidelines.join()].join('|'),
      () => {
        requestAnimationFrame(buildElementGuidelines)
      },
    )

    /**
     * Adding or deleting a layer changes what there is to align against — and a
     * deleted one must stop being drawn round.
     */
    const unsubLayers = subscribeSelector(
      widgetState,
      () => widgetState.dWidgets.map((item) => item.uuid).join(','),
      () => {
        dropDeletedTargets()
        requestAnimationFrame(buildElementGuidelines)
      },
    )

    /** Locking or unlocking the selected layer changes which handles it gets. */
    const unsubLock = subscribeSelector(
      widgetState,
      () => `${widgetState.dActiveElement?.uuid}:${widgetState.dActiveElement?.lock ? 1 : 0}`,
      () => {
        const active = widgetState.dActiveElement
        if (active && active.uuid !== '-1' && widgetState.dSelectWidgets.length <= 1) drawActiveTarget(active)
      },
    )

    /** Snapping is a preference, and it is allowed to be off. */
    const unsubSnap = subscribeKey(controlState, 'dSnapEnabled', (enabled) => {
      if (!moveable) return
      moveable.snappable = enabled
    })

    /**
     * Turning the grid on or changing how fine it is replaces every stand-in
     * inside the page, so what there is to line up against has to be gathered
     * again. A frame later, once React has drawn the new ones.
     */
    const unsubGrid = subscribeSelector(
      controlState,
      () => `${controlState.dShowGrid ? 1 : 0}:${controlState.dGridSize}`,
      () => {
        requestAnimationFrame(buildElementGuidelines)
      },
    )

    return () => {
      clearTimeout(emptyTimer)
      hideRotateReadout()
      mainEl?.removeEventListener('scroll', onScroll)
      unsubActive()
      unsubShowMoveable()
      unsubShowRotatable()
      unsubUpdateRect()
      unsubUpdateSelect()
      unsubSelectWidgets()
      unsubGuides()
      unsubLayers()
      unsubSnap()
      unsubGrid()
      unsubLock()
      selecto.destroy()
      moveable?.destroy()
      moveable = null
    }
  }, [])

  return <div id="empty" className="moveable__remove-item zk-moveable-style" />
}
