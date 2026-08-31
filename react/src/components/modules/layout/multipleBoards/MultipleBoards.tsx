import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, widgetState } from '@/store/state'
import { setBottomHeight, setDPage, updateDPage } from '@/store/canvas'
import { setShowMoveable } from '@/store/control'
import { setZoomScreenChange } from '@/store/force'
import { getWidgets, setDWidgets } from '@/store/widget/widget'
import { selectWidget } from '@/store/widget/select'
import message from '@/components/ui/message'
import { staticWidgetComponents } from '../../widgets/registry'
import { cx } from '@/utils/dom'
import type { TdWidgetData, TPageState } from '@/store/types'
import './multipleBoards.less'

function getTransform(global: TPageState) {
  const { width, height } = global
  const isVertical = height > width
  const edge = isVertical ? Math.max(width, height) : Math.min(width, height)
  const s = 72 / edge
  const left = isVertical ? ((72 - width * s) / 2 - 1) / s : 0
  return `scale(${s}) translateX(${left}px)`
}

function getPW(global: TPageState) {
  const { width, height } = global
  const isVertical = height > width
  const s = 72 / Math.min(width, height)
  return isVertical ? 72 : width * s
}

function StaticLayers({ layers, global }: { layers: readonly TdWidgetData[]; global: TPageState }) {
  const top = useMemo(() => layers.filter((item) => item.parent === global.uuid), [layers, global.uuid])
  return (
    <>
      {top.map((layer) => {
        const Comp = staticWidgetComponents[layer.type]
        if (!Comp) return null
        return (
          <Comp key={layer.uuid} params={layer as TdWidgetData} parent={global}>
            {layer.isContainer
              ? layers
                  .filter((item) => item.parent === layer.uuid)
                  .map((widget) => {
                    const ChildComp = staticWidgetComponents[widget.type]
                    if (!ChildComp) return null
                    return <ChildComp key={widget.uuid} params={widget as TdWidgetData} parent={layer as TdWidgetData} />
                  })
              : null}
          </Comp>
        )
      })}
    </>
  )
}

export default function MultipleBoards() {
  const canvas = useSnapshot(canvasState)
  const widgets = useSnapshot(widgetState)
  const [isFold, setIsFold] = useState(true)
  const [st, setSt] = useState(0)
  const [sl, setSl] = useState(0)
  const listRef = useRef<HTMLDivElement | null>(null)
  const mainElRef = useRef<HTMLElement | null>(null)
  const index = canvas.dCurrentPage
  const dLayouts = widgets.dLayouts

  useEffect(() => {
    const mainEl = document.getElementById('main')
    mainElRef.current = mainEl
    if (!mainEl) return
    const onScroll = () => {
      setSt(mainEl.scrollTop)
      setSl(mainEl.scrollLeft)
    }
    mainEl.addEventListener('scroll', onScroll)

    const list = listRef.current
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      if (list) list.scrollLeft += event.deltaY
    }
    list?.addEventListener('wheel', onWheel)

    return () => {
      mainEl.removeEventListener('scroll', onScroll)
      list?.removeEventListener('wheel', onWheel)
    }
  }, [])

  useEffect(() => {
    if (mainElRef.current) mainElRef.current.scrollTop = 0
  }, [canvas.dZoom])

  const firstFold = useRef(true)
  useEffect(() => {
    if (firstFold.current) {
      firstFold.current = false
      return
    }
    setBottomHeight(isFold ? 0 : 90)
    const timer = setTimeout(() => {
      setZoomScreenChange()
    }, 300)
    return () => clearTimeout(timer)
  }, [isFold])

  function getInitPage() {
    const clonePage = JSON.parse(JSON.stringify(canvasState.dPage))
    clonePage.backgroundColor = '#ffffffff'
    clonePage.backgroundGradient = ''
    clonePage.backgroundImage = ''
    return clonePage
  }

  function addLayer() {
    setShowMoveable(false)
    widgetState.dLayouts.push({ global: getInitPage(), layers: [] })
    canvasState.dCurrentPage = widgetState.dLayouts.length - 1
    setDWidgets(getWidgets())
    setDPage(getInitPage())
    updateDPage()
    selectWidget({ uuid: '-1' })
  }

  function selectPoster(i: number) {
    setShowMoveable(false)
    canvasState.dCurrentPage = i
    setDWidgets(getWidgets())
    setDPage(widgetState.dLayouts[i].global)
    selectWidget({ uuid: '-1' })
  }

  function removePoster(removeIndex: number) {
    if (index === removeIndex) {
      widgetState.dLayouts[removeIndex].layers.length = 0
      message('The page is now empty')
      setDWidgets([])
      setDPage(getInitPage())
    } else widgetState.dLayouts.splice(removeIndex, 1)
  }

  return (
    <div style={{ position: 'absolute', bottom: -1 * st + 'px', left: sl + 'px' }} className={cx('artboards', isFold ? 'fold' : 'unfold')}>
      <div ref={listRef} className="wrap">
        {isFold ? (
          <div className="btn" style={{ display: dLayouts.length > 0 ? undefined : 'none' }} onClick={() => setIsFold(!isFold)}>
            Page {index + 1}/{dLayouts.length} <i className="icon sd-zhankai" />
          </div>
        ) : (
          <div className="list">
            <span onClick={() => setIsFold(!isFold)} className="icon-btn">
              <i className="icon sd-zhankai" />
            </span>
            {dLayouts.map((l, li) => (
              <div
                key={'l' + li}
                style={{ width: getPW(l.global as TPageState) + 'px' }}
                onClick={() => selectPoster(li)}
                className={cx('item-box', index == li ? 'item-select' : 'item-default')}
              >
                <div
                  className="mini-poster"
                  style={{
                    transform: getTransform(l.global as TPageState),
                    width: l.global.width + 'px',
                    height: l.global.height + 'px',
                    backgroundColor: l.global.backgroundGradient ? undefined : l.global.backgroundColor,
                    backgroundImage: l.global.backgroundImage ? `url(${l.global?.backgroundImage})` : l.global.backgroundGradient || undefined,
                    backgroundSize: l.global.backgroundTransform?.x ? 'auto' : 'cover',
                    backgroundPositionX: (l.global.backgroundTransform?.x || 0) + 'px',
                    backgroundPositionY: (l.global.backgroundTransform?.y || 0) + 'px',
                  }}
                >
                  <StaticLayers layers={l.layers} global={l.global as TPageState} />
                </div>
                <div className="item-idx">{li + 1}</div>
                <i
                  onClick={(e) => {
                    e.stopPropagation()
                    removePoster(li)
                  }}
                  className="icon sd-quxiao"
                />
              </div>
            ))}
            {dLayouts.length < 9 ? (
              <div onClick={addLayer} className="item-add">
                <i className="iconfont icon-add" />
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
