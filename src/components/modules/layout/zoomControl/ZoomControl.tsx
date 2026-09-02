import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { proxy, useSnapshot } from 'valtio'
import { subscribeKey } from 'valtio/utils'
import { subscribeSelector } from '@/store/subscribe'
import addMouseWheel from '@/common/methods/addMouseWheel'
import { updatePaddingTop, updateScreen, updateZoom } from '@/store/canvas'
import { canvasState, forceState } from '@/store/state'
import { findClosestNumber } from '@/utils/utils'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import { OtherList, ZoomList, type TZoomData } from './data'
import './zoomControl.less'

export type ZoomControlHandle = {
  screenChange: () => void
  add: () => void
  sub: () => void
}

const local = proxy({
  hideControl: false,
  activezoomIndex: 0,
  show: false,
  zoom: { value: 0, text: '' } as TZoomData,
  otherIndex: -1,
})

let bestZoom = 0
let curAction = ''

function calcZoom() {
  const presetPadding = canvasState.dPresetPadding
  const diffHeight = presetPadding * 2 + 2 + canvasState.dBottomHeight
  const diffWidth = presetPadding * 2 + 22
  const widthZoom = ((canvasState.dScreen.width - diffWidth) * 100) / canvasState.dPage.width
  const heightZoom = ((canvasState.dScreen.height - diffHeight) * 100) / canvasState.dPage.height
  bestZoom = Math.min(widthZoom, heightZoom)
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
  local.zoom = next
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
  if (local.activezoomIndex === ZoomList.length - 1) {
    updateZoom(calcZoom())
    autoFixTop()
  }
}

function add() {
  curAction = 'add'
  local.show = false
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

function mousewheelZoom(down: boolean) {
  const value = Number(canvasState.dZoom.toFixed(0))
  if (down && value <= 1) return
  const next = down ? value - 2 : value + 2
  updateZoom(next)
  local.zoom.text = next + '%'
  local.zoom.value = next
  autoFixTop()
  const closest = findClosestNumber(
    value,
    ZoomList.map((x) => x.value),
  )
  setActiveZoomIndex(ZoomList.findIndex((x) => x.value === closest))
}

const ZoomControl = forwardRef<ZoomControlHandle>(function ZoomControl(_props, ref) {
  const snap = useSnapshot(local)
  const mode = useEditorMode()
  const resizeTimer = useRef<any>(null)

  useImperativeHandle(ref, () => ({ screenChange, add, sub }), [])

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

    const removeMouseWheel = addMouseWheel('page-design', (isDown: boolean) => {
      mousewheelZoom(isDown)
    })

    const changeScreen = () => {
      clearTimeout(resizeTimer.current)
      resizeTimer.current = setTimeout(() => {
        const screen = document.getElementById('page-design')
        if (!screen) return
        updateScreen({ width: screen.offsetWidth, height: screen.offsetHeight })
      }, 300)
    }
    window.addEventListener('resize', changeScreen)

    const unsubCanvas = subscribeSelector(
      canvasState,
      () => [canvasState.dScreen.width, canvasState.dScreen.height, canvasState.dPage.width, canvasState.dPage.height, canvasState.dPage.uuid],
      screenChange,
    )
    const unsubForce = subscribeKey(forceState, 'zoomScreenChange', () => {
      setActiveZoomIndex(ZoomList.length - 1)
      screenChange()
    })

    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('resize', changeScreen)
      removeMouseWheel()
      clearTimeout(resizeTimer.current)
      unsubCanvas()
      unsubForce()
    }
  }, [mode])

  function selectItem(index: number) {
    setActiveZoomIndex(index)
    setOtherIndex(-1)
    local.show = false
  }

  return (
    <div id="zoom-control">
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
            {snap.zoom.text}
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
        </div>
      ) : null}
    </div>
  )
})

export default ZoomControl
