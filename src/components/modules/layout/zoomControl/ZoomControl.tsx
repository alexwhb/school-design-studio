import { forwardRef, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { subscribeSelector } from '@/store/subscribe'
import addWheelZoom from '@/common/methods/addWheelZoom'
import { updatePaddingTop, updateScreen, updateZoom } from '@/store/canvas'
import { canvasState, forceState } from '@/store/state'
import { notesState } from '@/store/notes'
import { findClosestNumber } from '@/utils/utils'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import { OtherList, ZoomList, type TZoomData } from './data'
import * as zoomAnchor from './zoomAnchor'
import { fitZoom, MAX_ZOOM, MIN_ZOOM } from './fitZoom'
import './zoomControl.less'

export type ZoomControlHandle = {
  screenChange: () => void
  add: () => void
  sub: () => void
  fit: () => void
}

const local = proxy({
  hideControl: false,
  activezoomIndex: 0,
  show: false,
  otherIndex: -1,
})

let bestZoom = 0
let curAction = ''

function calcZoom() {
  bestZoom = fitZoom({ screen: canvasState.dScreen, page: canvasState.dPage, padding: canvasState.dPresetPadding, bottom: canvasState.dBottomHeight })
  return bestZoom
}

function autoFixTop() {
  const presetPadding = canvasState.dPresetPadding
  const headerBarHeight = 54
  const clientHeight = window.innerHeight - headerBarHeight - canvasState.dBottomHeight
  const outPageHeight = Math.round((canvasState.dPage.height * canvasState.dZoom) / 100 + presetPadding * 2)
  let padding = (clientHeight - outPageHeight) / 2
  curAction === 'add' && (padding -= presetPadding)
  updatePaddingTop(padding > 0 ? padding : 0)
}

function applyZoom(next: TZoomData) {
  let realValue = next.value
  if (realValue === -1) {
    realValue = calcZoom()
  }
  updateZoom(realValue)
  autoFixTop()
}

function setActiveZoomIndex(value: number) {
  if (local.activezoomIndex === value) return
  local.activezoomIndex = value
  if (value < 0 || value > ZoomList.length - 1) {
    return
  }
  applyZoom(JSON.parse(JSON.stringify(ZoomList[value])))
}

function setOtherIndex(value: number) {
  if (local.otherIndex === value) return
  local.otherIndex = value
  if (value < 0 || value > OtherList.length - 1) {
    return
  }
  applyZoom(JSON.parse(JSON.stringify(OtherList[value])))
}

function screenChange() {
  zoomAnchor.clear()
  if (local.activezoomIndex === ZoomList.length - 1) {
    updateZoom(calcZoom())
    autoFixTop()
  }
}

function add() {
  curAction = 'add'
  local.show = false
  zoomAnchor.captureCentre()
  if (local.activezoomIndex === ZoomList.length - 2 || local.activezoomIndex === ZoomList.length - 1) {
    setActiveZoomIndex(ZoomList.length)
    if (bestZoom) {
      nearZoom(true)
    } else {
      setOtherIndex(local.otherIndex + 1)
    }
    return
  }
  if (local.activezoomIndex != ZoomList.length) {
    setActiveZoomIndex(local.activezoomIndex + 1)
    return
  }
  if (local.otherIndex < OtherList.length - 1) {
    setOtherIndex(local.otherIndex + 1)
  }
}

function sub() {
  curAction = ''
  local.show = false
  zoomAnchor.captureCentre()
  if (local.otherIndex === 0) {
    setOtherIndex(-1)
    setActiveZoomIndex(ZoomList.length - 2)
    return
  }
  if (local.otherIndex != -1) {
    setOtherIndex(local.otherIndex - 1)
    return
  }
  if (local.activezoomIndex === ZoomList.length - 1) {
    nearZoom()
    return
  }
  if (local.activezoomIndex != 0) {
    setActiveZoomIndex(local.activezoomIndex - 1)
  }
}

function nearZoom(isAdd?: boolean) {
  for (let i = 0; i < ZoomList.length; i++) {
    setActiveZoomIndex(i)
    if (ZoomList[i].value > bestZoom) {
      if (isAdd) break
    } else if (ZoomList[i].value < bestZoom) {
      if (!isAdd) break
    }
  }
  bestZoom = 0
}

/**
 * Moves the tick in the preset lists to the zoom a gesture landed on, without
 * applying that preset. Going through setActiveZoomIndex here is what used to
 * snap the first notch of the wheel to the nearest round number — it re-applies
 * whatever it selects, so 102% became 100% and the gesture fought back.
 *
 * "Fit to screen" is skipped: its value is a sentinel, not a zoom.
 */
function syncActiveIndex(zoom: number) {
  const presets = ZoomList.filter((x) => x.value > 0).map((x) => x.value)
  const others = OtherList.map((x) => x.value)
  const closest = findClosestNumber(zoom, presets.concat(others))
  const inOther = others.indexOf(closest)
  local.otherIndex = inOther
  local.activezoomIndex = inOther === -1 ? ZoomList.findIndex((x) => x.value === closest) : ZoomList.length
}

/** A wheel notch or a pinch: multiply the zoom, and hold the point under the pointer still. */
function scaleZoom(factor: number, clientX: number, clientY: number) {
  const current = canvasState.dZoom
  const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current * factor))
  if (Math.abs(next - current) < 0.01) return
  zoomAnchor.capture(clientX, clientY)
  curAction = ''
  updateZoom(next)
  autoFixTop()
  syncActiveIndex(next)
}

const ZoomControl = forwardRef<ZoomControlHandle>(function ZoomControl(_props, ref) {
  const snap = useSnapshot(local)
  const zoom = useSnapshot(canvasState).dZoom
  const mode = useEditorMode()
  const resizeTimer = useRef<any>(null)

  useImperativeHandle(ref, () => ({ screenChange, add, sub, fit: fitToScreen }), [])

  // After React has written the new sizes and before the browser paints, so the
  // board does not jump for a frame on the way to the anchored position.
  useLayoutEffect(zoomAnchor.apply, [zoom])

  useEffect(() => {
    const close = () => {
      local.show = false
    }
    window.addEventListener('click', close)

    if (mode === 'draw') {
      setActiveZoomIndex(3)
      local.hideControl = true
    } else {
      setActiveZoomIndex(ZoomList.length - 1)
    }

    const removeWheelZoom = addWheelZoom('page-design', { scale: scaleZoom })

    const changeScreen = () => {
      clearTimeout(resizeTimer.current)
      resizeTimer.current = setTimeout(() => {
        // #main rather than #page-design, which is what this used to measure.
        // #page-design carries an inline min-width of the page at its current
        // zoom, so its width can grow with the window but never shrink back:
        // narrow the window at a fixed zoom and the board stayed measured at
        // whatever it had been, and "fit to screen" fitted a workspace that was
        // no longer there. #main is the board's own box and gives both.
        const screen = document.getElementById('main')
        if (!screen) return
        updateScreen({ width: screen.offsetWidth, height: screen.offsetHeight })
      }, 300)
    }
    window.addEventListener('resize', changeScreen)

    const unsubCanvas = subscribeSelector(canvasState, () => [canvasState.dScreen.width, canvasState.dScreen.height, canvasState.dPage.width, canvasState.dPage.height, canvasState.dPage.uuid], screenChange)
    const unsubForce = subscribeKey(forceState, 'zoomScreenChange', () => {
      setActiveZoomIndex(ZoomList.length - 1)
      screenChange()
    })

    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('resize', changeScreen)
      removeWheelZoom()
      clearTimeout(resizeTimer.current)
      unsubCanvas()
      unsubForce()
    }
  }, [mode])

  function selectItem(index: number) {
    zoomAnchor.captureCentre()
    setActiveZoomIndex(index)
    setOtherIndex(-1)
    local.show = false
  }

  /**
   * Fits the page to the well. Its own button rather than the last row of the
   * list, because it is the one zoom anybody asks for by name, and because the
   * pill now reads as a number: "Fit to screen" is not one.
   */
  function fitToScreen() {
    zoomAnchor.clear()
    setOtherIndex(-1)
    setActiveZoomIndex(ZoomList.length - 1)
    // The page may have moved since the last fit, which leaves the index where
    // it already was and nothing else to do it.
    screenChange()
    local.show = false
  }

  const notesOpen = useSnapshot(notesState).open
  // The pill says what the zoom is, not which preset was picked: the presets
  // are all percentages bar one, and "Fit to screen" has a button of its own.
  const zoomLabel = Math.round(zoom) + '%'

  return (
    <div id="zoom-control" className={notesOpen ? 'above-notes' : undefined}>
      <ul className="zoom-selecter" style={{ display: snap.show ? undefined : 'none' }}>
        {ZoomList.map((item, index) => (
          <li
            key={index}
            className={'zoom-item' + (snap.activezoomIndex === index ? ' zoom-item-active' : '')}
            onClick={(e) => {
              e.stopPropagation()
              selectItem(index)
            }}
          >
            <span>{item.text}</span>
            {snap.activezoomIndex === index ? <i className="iconfont icon-selected" /> : null}
          </li>
        ))}
      </ul>
      {!snap.hideControl ? (
        <div className="zoom-control-wrap">
          <div
            className={'zoom-icon radius-left' + (snap.activezoomIndex === 0 ? ' disable' : '')}
            onClick={(e) => {
              e.stopPropagation()
              local.activezoomIndex > 0 && sub()
            }}
          >
            <i className="iconfont icon-sub" />
          </div>
          <div
            className={'zoom-text' + (snap.show ? ' zoom-text-active' : '')}
            onClick={(e) => {
              e.stopPropagation()
              local.show = !local.show
            }}
          >
            {zoomLabel}
          </div>
          <div
            className={'zoom-icon radius-right' + (snap.otherIndex === OtherList.length - 1 ? ' disable' : '')}
            onClick={(e) => {
              e.stopPropagation()
              local.otherIndex < OtherList.length - 1 && add()
            }}
          >
            <i className="iconfont icon-add" />
          </div>
          <div className="zoom-divider" />
          <div
            className="zoom-fit"
            onClick={(e) => {
              e.stopPropagation()
              fitToScreen()
            }}
          >
            Fit
          </div>
        </div>
      ) : null}
    </div>
  )
})

export default ZoomControl
