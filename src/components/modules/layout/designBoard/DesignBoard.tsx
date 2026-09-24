import { memo, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, controlState, forceState, widgetState } from '@/store/state'
import { updateScreen } from '@/store/canvas'
import { setShowMoveable, setDraging } from '@/store/control'
import { addGroup, addWidget } from '@/store/widget'
import { setDropOver, setSelectItem, selectWidget } from '@/store/widget'
import { getTarget } from '@/common/methods/target'
import { getAppRoot } from '@/common/hooks/appRoot'
import { recordHistory } from '@/common/hooks/history'
import { fillPicture, pictureTargetOf } from '@/store/widget/fillPicture'
import { pageBackgroundStyle } from '@/common/methods/pageBackground'
import setWidgetData from '@/common/methods/DesignFeatures/setWidgetData'
import getComponentsData from '@/common/methods/DesignFeatures/setComponents'
import { moveInit } from '@/mixins/move'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import type { TdWidgetData, TPageState } from '@/store/types'
import { widgetComponents } from '../../widgets/registry'
import { cx } from '@/utils/dom'
import PageGrid from './comps/PageGrid'
import ResizePage from './comps/ResizePage'
import SnapGuides from './comps/SnapGuides'
import './designBoard.less'

type Props = {
  pageDesignCanvasId: string
  padding?: number
  renderDPage?: TPageState
  renderDWidgets?: TdWidgetData[]
  zoom?: number
  className?: string
  children?: ReactNode
  bottom?: ReactNode
}

const Layers = memo(function Layers({
  needTools,
  pageUuid,
  parentLeft,
  parentTop,
  widgets,
}: {
  needTools: boolean
  pageUuid: string
  parentLeft: number
  parentTop: number
  /** Supplied by the render-only screens, which draw a page they hold themselves. */
  widgets?: TdWidgetData[]
}) {
  const snap = useSnapshot(widgetState)
  const layoutsChange = useSnapshot(forceState).layoutsChange
  const hoverUuid = snap.dHoverUuid
  const activeUuid = snap.dActiveElement?.uuid
  const activeParent = snap.dActiveElement?.parent

  const parent = useMemo(() => ({ left: parentLeft, top: parentTop, uuid: pageUuid }), [parentLeft, parentTop, pageUuid])

  const layers = useMemo(() => {
    if (widgets) return widgets.filter((item) => item.parent === pageUuid && !item.hidden)
    const raw = widgetState.dWidgets
    const out: TdWidgetData[] = []
    for (let i = 0; i < raw.length; i++) {
      // Both tests read the snapshot rather than the raw widget: that is what
      // registers them with valtio, and hiding a layer must repaint the page.
      if (snap.dWidgets[i].parent === pageUuid && !snap.dWidgets[i].hidden) out.push(raw[i])
    }
    return out
  }, [snap.dWidgets, pageUuid, widgets, layoutsChange])

  return (
    <>
      {layers.map((layer) => {
        const Comp = widgetComponents[layer.type]
        if (!Comp) return null
        return (
          <Comp key={layer.uuid} id={layer.uuid} params={layer} parent={parent} className={cx({ layer: needTools }, { 'layer-hover': layer.uuid === hoverUuid || activeParent === layer.uuid, 'layer-no-hover': activeUuid === layer.uuid })} data-title={layer.type} data-type={layer.type} data-uuid={layer.uuid}>
            {layer.isContainer ? <Children parentLayer={layer} needTools={needTools} activeUuid={activeUuid} activeParent={activeParent} widgets={widgets} /> : null}
          </Comp>
        )
      })}
    </>
  )
})

function Children({ parentLayer, needTools, activeUuid, activeParent, widgets }: { parentLayer: TdWidgetData; needTools: boolean; activeUuid?: string; activeParent?: string; widgets?: TdWidgetData[] }) {
  const snap = useSnapshot(widgetState)
  const layoutsChange = useSnapshot(forceState).layoutsChange
  const childs = useMemo(() => {
    if (widgets) return widgets.filter((item) => item.parent === parentLayer.uuid && !item.hidden)
    const raw = widgetState.dWidgets
    const out: TdWidgetData[] = []
    for (let i = 0; i < raw.length; i++) {
      if (snap.dWidgets[i].parent === parentLayer.uuid && !snap.dWidgets[i].hidden) out.push(raw[i])
    }
    return out
  }, [snap.dWidgets, parentLayer.uuid, widgets, layoutsChange])

  return (
    <>
      {childs.map((widget) => {
        const Comp = widgetComponents[widget.type]
        if (!Comp) return null
        return <Comp key={widget.uuid} id={widget.uuid} child params={widget} parent={parentLayer} className={cx({ layer: needTools }, { 'layer-no-hover': activeUuid !== widget.parent && activeParent !== widget.parent })} data-title={widget.type} data-type={widget.type} data-uuid={widget.uuid} />
      })}
    </>
  )
}

export default function DesignBoard({ pageDesignCanvasId, padding, renderDPage, renderDWidgets, zoom, className, children, bottom }: Props) {
  const mode = useEditorMode()
  const needTools = mode !== 'draw' && mode !== 'html'

  const canvas = useSnapshot(canvasState)
  const dPage = renderDPage ?? (canvas.dPage as TPageState)
  const dZoom = zoom ?? canvas.dZoom
  const { dPresetPadding, dPaddingTop } = canvas

  useEffect(() => {
    getScreen()
    const pageDesignEl = document.getElementById('page-design')
    if (!pageDesignEl) return
    pageDesignEl.addEventListener('mousedown', handleSelection, false)

    const scrollContainer = document.querySelector('#main') as HTMLElement
    const dragContainer = pageDesignEl as any
    dragContainer.onmousedown = (e: MouseEvent) => {
      const mouseDownScrollPosition = {
        scrollLeft: scrollContainer.scrollLeft,
        scrollTop: scrollContainer.scrollTop,
      }
      const mouseDownPoint = { x: e.clientX, y: e.clientY }
      dragContainer.onmousemove = (ev: MouseEvent) => {
        if (!controlState.dSpaceDown) return
        const dragMoveDiff = {
          x: mouseDownPoint.x - ev.clientX,
          y: mouseDownPoint.y - ev.clientY,
        }
        scrollContainer.scrollLeft = mouseDownScrollPosition.scrollLeft + dragMoveDiff.x
        scrollContainer.scrollTop = mouseDownScrollPosition.scrollTop + dragMoveDiff.y
      }
      document.onmouseup = () => {
        dragContainer.onmousemove = null
        document.onmouseup = null
      }
    }

    return () => {
      pageDesignEl.removeEventListener('mousedown', handleSelection, false)
      dragContainer.onmousedown = null
      dragContainer.onmousemove = null
    }
  }, [])

  function currentWidgets() {
    return renderDWidgets ?? widgetState.dWidgets
  }

  function currentZoom() {
    return zoom ?? canvasState.dZoom
  }

  /**
   * A picture from the panel, dragged over the page: the photo or the empty
   * slot under the pointer is marked as where it will go. See fillPicture.ts.
   */
  function dropOver(event: React.MouseEvent) {
    const e = event.nativeEvent
    const active = widgetState.dActiveElement
    if (!active) return
    if (active.editable || active.lock) {
      return false
    }
    e.preventDefault()
    const { data, type } = widgetState.selectItem
    const target = data && type === 'image' && controlState.dDraging ? pictureTargetOf(e.target as Element) : null
    const next = target ?? '-1'
    if (widgetState.dDropOverUuid !== next) setDropOver(next)
    // The picture following the pointer sits right over the frame it is about
    // to fill; it fades while it is over one, so the frame's mark shows.
    getAppRoot()?.classList.toggle('ds-drop-into', !!target)
  }

  async function drop(event: React.MouseEvent) {
    const e = event.nativeEvent as MouseEvent & { layerX: number; layerY: number }
    if (!controlState.dDraging) {
      return
    }
    if (!e || !e.target) return
    const eventTarget = e.target as HTMLElement

    setDraging(false)

    // Read before anything waits: where the pointer was when it let go.
    const droppedIn = widgetState.dDropOverUuid && widgetState.dDropOverUuid !== '-1' ? widgetState.dDropOverUuid : ''
    setDropOver('-1')
    getAppRoot()?.classList.remove('ds-drop-into')
    setShowMoveable(false)

    const lost = eventTarget.className !== 'design-canvas'
    e.preventDefault()
    const { data: item, type } = JSON.parse(JSON.stringify(widgetState.selectItem))
    setSelectItem({})

    let setting: Partial<TPageState> = {}
    if (!type) {
      return
    }
    const built = await setWidgetData(type, item, setting)
    // Null means the drop was abandoned — see `setWidgetData`. It has already
    // said why, so there is nothing to add here.
    if (!built) return
    setting = built

    // Onto a photo, or the slot one goes in: the picture goes into that frame.
    // The address is the one `setWidgetData` settled on, which for a stock
    // photo is the host's own copy.
    if (type === 'image' && droppedIn && fillPicture(droppedIn, { url: String(setting.imgUrl), width: Number(setting.width), height: Number(setting.height) })) {
      setShowMoveable(true)
      return
    }

    const canvasEl = document.getElementById('page-design-canvas')
    if (!canvasEl) return
    const lostX = e.x - canvasEl.getBoundingClientRect().left
    const lostY = e.y - canvasEl.getBoundingClientRect().top
    const zoomValue = currentZoom()

    // Each through recordHistory, because the widget is only added once the
    // picture or the component has been fetched, which is long after the
    // release that would otherwise have closed the undo step on nothing.
    if (type === 'group') {
      const parent: { width?: number; height?: number } = {}
      const componentItem = await getComponentsData(item)
      componentItem.forEach((element) => {
        if (element.type === 'w-group') {
          parent.width = element.width
          parent.height = element.height
        }
      })
      const groupHalf = {
        x: parent.width ? (parent.width * zoomValue) / 100 / 2 : 0,
        y: parent.height ? (parent.height * zoomValue) / 100 / 2 : 0,
      }
      componentItem.forEach((element) => {
        element.left += (lost ? lostX - groupHalf.x : e.layerX - groupHalf.x) * (100 / zoomValue)
        element.top += (lost ? lostY - groupHalf.y : e.layerY - groupHalf.y) * (100 / zoomValue)
      })
      recordHistory(() => addGroup(componentItem))
    }

    const half = {
      x: setting.width ? (setting.width * zoomValue) / 100 / 2 : 0,
      y: setting.height ? (setting.height * zoomValue) / 100 / 2 : 0,
    }
    setting.left = (lost ? lostX - half.x : e.layerX - half.x) * (100 / zoomValue)
    setting.top = (lost ? lostY - half.y : e.layerY - half.y) * (100 / zoomValue)
    if (type !== 'group' && type !== 'bg') {
      recordHistory(() => addWidget(setting as TdWidgetData))
    }
  }

  function getScreen() {
    const pageDesignEl = document.getElementById('page-design')
    if (!pageDesignEl) return
    updateScreen({
      width: pageDesignEl.offsetWidth,
      height: pageDesignEl.offsetHeight,
    })
  }

  async function handleSelection(e: MouseEvent) {
    if (e.which === 3) {
      return
    }
    if (!e || !e.target) return
    const target = await getTarget(e.target as HTMLElement)
    if (!target) return
    const type = target.getAttribute('data-type')

    if (type) {
      let uuid = target.getAttribute('data-uuid')
      if (uuid !== '-1' && !controlState.dAltDown) {
        const widget = currentWidgets().find((item) => item.uuid === uuid)
        const active = widgetState.dActiveElement
        if (!widget || !active) return
        if (widget.parent !== '-1' && widget.parent !== active.uuid && widget.parent !== active.parent) {
          uuid = widget.parent || null
        }
      }

      if (controlState.showRotatable !== false) {
        selectWidget({ uuid: uuid ?? ' -1' })
      }

      if (uuid !== '-1') {
        moveInit.initmovement(e)
      }
    } else {
      selectWidget({ uuid: '-1' })
    }
  }

  const outPadding = padding ?? dPresetPadding

  return (
    <div id="main" className={className}>
      <div id="page-design" style={{ paddingTop: dPaddingTop + 'px', minWidth: (dPage.width * dZoom) / 100 + outPadding * 2 + 'px' }}>
        <div
          id="out-page"
          className="out-page"
          style={{
            padding: padding ?? dPresetPadding + 'px',
            width: (dPage.width * dZoom) / 100 + outPadding * 2 + 'px',
            height: (dPage.height * dZoom) / 100 + outPadding * 2 + 'px',
            opacity: 1 - (dZoom < 100 ? dPage.tag : 0),
          }}
        >
          {children}
          {needTools ? <ResizePage width={(dPage.width * dZoom) / 100} height={(dPage.height * dZoom) / 100} /> : null}
          <div
            id={pageDesignCanvasId}
            className="design-canvas"
            data-type={dPage.type}
            data-uuid={dPage.uuid}
            style={{
              width: dPage.width + 'px',
              height: dPage.height + 'px',
              transform: 'scale(' + dZoom / 100 + ')',
              transformOrigin: (dZoom >= 100 ? 'center' : 'left') + ' top',
              ...pageBackgroundStyle(dPage),
              opacity: dPage.opacity + (dZoom < 100 ? dPage.tag : 0),
            }}
            onMouseMove={dropOver}
            onDrop={drop as any}
            onMouseUp={drop}
          >
            {/* Under the artwork, and out of every export: see PageGrid */}
            {needTools ? <PageGrid width={dPage.width} height={dPage.height} zoom={dZoom} /> : null}
            <Layers needTools={needTools} pageUuid={dPage.uuid} parentLeft={dPage.left} parentTop={dPage.top} widgets={renderDWidgets} />
            {/* What Moveable snaps to when a ruler guide is in the way */}
            {needTools ? <SnapGuides /> : null}
          </div>
        </div>
      </div>
      {bottom}
    </div>
  )
}
