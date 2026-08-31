import { useEffect } from 'react'
import { subscribeKey } from 'valtio/utils'
import { subscribeSelector } from '@/store/subscribe'
import MoveableClass, { EVENTS } from 'moveable'
import MoveableHelper from 'moveable-helper'
import { canvasState, controlState, forceState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { resize } from '@/store/widget/resize'
import { updateWidgetData, updateWidgetMultiple } from '@/store/widget/widget'
import useSelecto from './Selecto'
import './style/index.less'

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
      snappable: true,
      elementGuidelines: [],
      verticalGuidelines: [],
      horizontalGuidelines: [],
      snapThreshold: 4,
      isDisplaySnapDigit: true,
      snapGap: false,
      snapElement: true,
      snapVertical: true,
      snapHorizontal: true,
      snapCenter: false,
      snapDigit: 0,
      triggerAblesSimultaneously: true,
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
        active.lock && stop()
      })
      .on('drag', ({ target, left, top }: any) => {
        target!.style.left = `${left}px`
        target!.style.top = `${top}px`
        holdPosition = { left, top }
      })
      .on('dragEnd', ({ inputEvent }: any) => {
        widgetState.activeMouseEvent = null

        inputEvent.stopPropagation()
        inputEvent.preventDefault()
        if (holdPosition) {
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
      .on('rotate', ({ target, transform }: any) => {
        target.style.transform = transform
        target.style.height = widgetState.dActiveElement?.height + 'px'
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
        rotate &&
          updateWidgetData({
            uuid: widgetState.dActiveElement?.uuid || '',
            key: 'rotate',
            value: rotate,
          })
      })
      .on('resizeStart', (args: any) => {
        if (!moveable) return
        moveable.snappable = false
        const active = widgetState.dActiveElement
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
        } else if (active?.type === 'w-image' || active?.type === 'w-qrcode' || active?.type === 'w-svg') {
          const dirs = ['1,0', '0,-1', '-1,0', '0,1']
          dirs.includes(String(args.direction)) && (moveable.keepRatio = false)
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
        moveable.snappable = true
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
      .on('resizeGroupStart', () => {})
      .on('resizeGroup', () => {})
      .on('resizeGroupEnd', () => {})

    useSelecto(moveable)

    const onScroll = () => {
      if (!moveable) return
      moveable.updateRect()
    }
    const mainEl = document.getElementById('main')
    mainEl?.addEventListener('scroll', onScroll)

    const unsubActive = subscribeKey(widgetState, 'dActiveElement', (val) => {
      setTimeout(() => {
        checkMouseEvent()
      }, 10)
      if (!val || !val.record) {
        return
      }
      if (!moveable) return
      if (Number(val.uuid) != -1) {
        const target = `[id="${val.uuid}"]`
        _target = `[id="${val.uuid}"]`
        moveable.rotatable = true
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
        moveable.setState({ target: _target }, () => {
          checkMouseEvent()
        })
        setShowMoveable(true)
        if (moveable.elementGuidelines && !moveable.elementGuidelines.includes(target)) {
          moveable.elementGuidelines.push(target)
        }
      } else {
        moveable.target = `[id="empty"]`
        if (moveable.target !== `[id="empty"]`) {
          setTimeout(() => {
            if (!moveable) return
            moveable.target = `[id="empty"]`
          }, 210)
        }
        moveable.elementGuidelines && (moveable.elementGuidelines.length = 0)
      }
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
        moveable.renderDirections = []
        moveable.rotatable = false
        const targetCollector = [].slice.call(document.querySelectorAll('.widget-selected'))
        moveable.target = targetCollector
        for (let i = 0; i < items.length; i++) {
          document.getElementById(items[i].uuid)?.classList.remove('widget-selected')
        }
      }, 400)
    })

    const unsubSelectWidgets = subscribeSelector(
      widgetState,
      () => widgetState.dSelectWidgets.map((item) => item.uuid).join(','),
      () => {
      if (!moveable) return
      const items = widgetState.dSelectWidgets
      const alt = controlState.dAltDown
      if (alt) {
        for (let i = 0; i < items.length; i++) {
          document.getElementById(items[i].uuid)?.classList.add('widget-selected')
        }
        moveable.renderDirections = []
        moveable.rotatable = false
        const targetCollector = [].slice.call(document.querySelectorAll('.widget-selected'))
        moveable.target = targetCollector
        for (let i = 0; i < items.length; i++) {
          document.getElementById(items[i].uuid)?.classList.remove('widget-selected')
        }
      }
      },
    )

    const unsubGuides = subscribeSelector(
      canvasState,
      () => [canvasState.guidelines.verticalGuidelines.join(), canvasState.guidelines.horizontalGuidelines.join()],
      () => {
        if (!moveable) return
        const lines = canvasState.guidelines
        moveable.verticalGuidelines = lines.verticalGuidelines
        moveable.horizontalGuidelines = lines.horizontalGuidelines
      },
    )

    return () => {
      mainEl?.removeEventListener('scroll', onScroll)
      unsubActive()
      unsubShowMoveable()
      unsubShowRotatable()
      unsubUpdateRect()
      unsubUpdateSelect()
      unsubSelectWidgets()
      unsubGuides()
      moveable?.destroy()
      moveable = null
    }
  }, [])

  return <div id="empty" className="moveable__remove-item zk-moveable-style" />
}
