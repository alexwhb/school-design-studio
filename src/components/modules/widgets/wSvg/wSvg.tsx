import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { updateWidgetData } from '@/store/widget/widget'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import { widgetBorder } from '../widgetBorder'
import { collectShapePaint, paintShape, type ShapePaint } from './shapePaint'
import applySvgBorder from './svgBorder'
import './wSvg.less'

function WSvg({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any

  const widgetRef = useRef<HTMLDivElement | null>(null)
  const shapePaint = useRef<ShapePaint | null>(null)
  const viewBox = useRef({ width: 0, height: 0 })
  const svgImg = useRef<Record<string, any> | null>(null)
  const svgRoot = useRef<SVGSVGElement | null>(null)
  const editBoxStyle = useRef<{ left: string; top: string; transform: string }>({ left: '', top: '', transform: '' })
  const cropWidgetXY = useRef<Record<string, any>>({})
  const loaded = useRef(false)

  useEffect(() => {
    let cancelled = false
    if (loaded.current) return
    loaded.current = true
    loadSvg().then(() => {
      if (cancelled) return
      updateRecord()
    })
    document.addEventListener('mouseup', touchend, false)
    return () => {
      cancelled = true
      document.removeEventListener('mouseup', touchend, false)
    }
  }, [params])

  useEffect(() => {
    updateRecord()
    setUpdateRect()
  })

  // Rebuilt from the store whenever it changes rather than once on mount, or an
  // undone rotation stays on screen: Moveable writes the turn straight to the
  // element, so nothing else puts it back.
  useEffect(() => {
    const el = widgetRef.current
    if (!el) return
    let transform = p.transform || ''
    if (p.rotate) transform += `rotate(${p.rotate})`
    el.style.transform = transform
  }, [p.transform, p.rotate])

  // Colours are put back from the store rather than only at load, so a swatch
  // or an undo repaints the shape that is already on the canvas — gradients
  // included, since those are paint servers that have to be rebuilt when their
  // stops change.
  useEffect(() => {
    if (shapePaint.current) paintShape(shapePaint.current, params.uuid, (params as any).colors || [])
  }, [p.colors, params])

  const cropEdit = p.cropEdit
  const lastCropEdit = useRef(cropEdit)
  useEffect(() => {
    if (lastCropEdit.current === cropEdit) return
    lastCropEdit.current = cropEdit
    const el = document.getElementById(params.uuid)
    if (cropEdit) {
      el?.addEventListener('mousedown', touchstart, false)
    } else {
      el?.removeEventListener('mousedown', touchstart, false)
    }
    return () => {
      el?.removeEventListener('mousedown', touchstart, false)
    }
  }, [cropEdit, params.uuid])

  useEffect(() => {
    if (!svgImg.current) return
    svgImg.current.attr({ 'xlink:href': params.imgUrl })
  }, [p.imgUrl, params])

  // The markup is parsed once and then lives in the DOM rather than in the
  // render, so an outline has to be written onto it by hand rather than drawn
  // by React. Effects run in the order they are declared and the parse above is
  // synchronous, so there is a node to write to by the time this first runs.
  useEffect(() => {
    drawBorder()
  }, [p.borderWidth, p.borderColor, p.borderStyle])

  function touchstart() {
    const editBox = document.getElementById(params.uuid + '_ebox')
    if (editBox) {
      cropWidgetXY.current = {
        x: Number(editBox.style.left.replace('px', '')) || 0,
        y: Number(editBox.style.top.replace('px', '')) || 0,
      }
    }
    document.addEventListener('mousemove', handlemousemove, true)
  }

  function touchend() {
    document.removeEventListener('mousemove', handlemousemove, true)
  }

  function handlemousemove(e: MouseEvent) {
    e.stopPropagation()
    e.preventDefault()
    const { left, top } = move(e)
    editBoxStyle.current.left = left + 'px'
    editBoxStyle.current.top = top + 'px'
    const { width, height } = params
    const { width: vWidth, height: vHeight } = viewBox.current
    const next = {
      x: left / (width / vWidth) / (params.zoom || 0),
      y: top / (height / vHeight) / (params.zoom || 0),
    }
    changeFinish('x', next.x)
    changeFinish('y', next.y)
  }

  function drawBorder() {
    if (svgRoot.current) applySvgBorder(svgRoot.current, widgetBorder(params))
  }

  function loadSvg() {
    const Snap = (window as any).Snap
    return new Promise<void>((resolve) => {
      if (!Snap || !params.svgUrl) {
        resolve()
        return
      }
      const parsed = Snap.parse(params.svgUrl)
      const svgNode: SVGSVGElement | null =
        parsed.node.nodeType === Node.ELEMENT_NODE ? parsed.node : parsed.node.querySelector('svg')
      if (!svgNode) {
        resolve()
        return
      }

      svgNode.removeAttribute('width')
      svgNode.removeAttribute('height')
      svgNode.setAttribute('style', 'height: inherit;width: inherit;')

      // Colours are stored as `{{colors[n]}}` placeholders in the markup, so
      // the shape is painted before it goes on screen rather than after.
      shapePaint.current = collectShapePaint(svgNode)
      paintShape(shapePaint.current, params.uuid, (params as any).colors || [])

      if (widgetRef.current) {
        widgetRef.current.appendChild(svgNode)
      }
      svgRoot.current = svgNode
      resolve()
    })
  }

  function updateRecord() {
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid) {
      const record = active.record
      if (record && widgetRef.current) {
        record.width = widgetRef.current.offsetWidth
        record.height = widgetRef.current.offsetHeight
      }
    }
    updateZoom()
  }

  function updateZoom() {
    editBoxStyle.current.transform = `scale(${params.zoom})`
    if (svgImg.current) {
      const { x = 0, y = 0 } = params as any
      svgImg.current.attr({
        x: x ?? 0,
        y: y ?? 0,
        style: `transform-origin: center;transform: scale(${params.zoom})`,
      })
      const { width, height } = params
      const { width: vWidth, height: vHeight } = viewBox.current
      editBoxStyle.current.left = x * (width / vWidth) * (params.zoom || 0) + 'px'
      editBoxStyle.current.top = y * (height / vHeight) * (params.zoom || 0) + 'px'
    }
  }

  function changeFinish(key: string, value: number) {
    updateWidgetData({ uuid: params.uuid, key: key as any, value })
  }

  function move(payload: Record<string, any>) {
    const widgetXY = { x: cropWidgetXY.current.x, y: cropWidgetXY.current.y }
    const dx = Number(payload.pageX) - widgetState.dMouseXY.x
    const dy = Number(payload.pageY) - widgetState.dMouseXY.y
    const left = Number(widgetXY.x) + Math.floor((dx * 100) / canvasState.dZoom)
    const top = Number(widgetXY.y) + Math.floor((dy * 100) / canvasState.dZoom)
    return { left, top }
  }

  return (
    <div
      {...rest}
      id={id ?? params.uuid}
      ref={widgetRef}
      className={cx('w-svg', className || '')}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    />
  )
}

export default memo(WSvg)
