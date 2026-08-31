import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, widgetState } from '@/store/state'
import { setUpdateRect } from '@/store/force'
import { updateWidgetData } from '@/store/widget/widget'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import './wSvg.less'

function WSvg({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any

  const widgetRef = useRef<HTMLDivElement | null>(null)
  const svgElements = useRef<Record<string, any>[] | null>(null)
  const viewBox = useRef({ width: 0, height: 0 })
  const svgImg = useRef<Record<string, any> | null>(null)
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
    const el = widgetRef.current
    if (el) {
      params.transform && (el.style.transform = params.transform)
      params.rotate && (el.style.transform += `rotate(${params.rotate})`)
    }
    return () => {
      cancelled = true
      document.removeEventListener('mouseup', touchend, false)
    }
  }, [params])

  useEffect(() => {
    updateRecord()
    setUpdateRect()
  })

  useEffect(() => {
    attrsChange()
  })

  const cropEdit = p.cropEdit
  const firstCrop = useRef(true)
  useEffect(() => {
    if (firstCrop.current) {
      firstCrop.current = false
      return
    }
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
      svgElements.current = []
      const colorsObj = color2obj()

      deepElement(svgNode)

      function deepElement(el: Record<string, any>) {
        elementFactory(el)
        el.childNodes.forEach((childNode: Record<string, any>) => deepElement(childNode))
      }

      function elementFactory(element: Record<string, any>) {
        if (!element.attributes) return
        const attrsColor: Record<string, any> = {}
        for (const attr of Array.from(element.attributes) as Record<string, any>[]) {
          if (!colorsObj[attr.value]) continue
          attr.value = colorsObj[attr.value]
          attrsColor[attr.name] = (params as any).colors.findIndex((x: string) => x == attr.value)
        }
        if (JSON.stringify(attrsColor) !== '{}' && svgElements.current) {
          svgElements.current.push({ item: element, attrsColor })
        }
      }

      if (widgetRef.current) {
        widgetRef.current.appendChild(svgNode)
      }
      resolve()
    })
  }

  function color2obj() {
    const obj: Record<string, any> = {}
    const colors = (params as any).colors || []
    for (let i = 0; i < colors.length; i++) {
      obj[`{{colors[${i}]}}`] = colors[i]
    }
    return obj
  }

  function updateRecord() {
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid) {
      const record = active.record
      if (widgetRef.current) {
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

  function attrsChange() {
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid && svgElements.current) {
      for (const element of svgElements.current) {
        const { item, attrsColor } = element
        for (const key in attrsColor) {
          if (Object.hasOwnProperty.call(attrsColor, key)) {
            const color = (params as any).colors[attrsColor[key]]
            item.setAttribute(key, color)
          }
        }
      }
    }
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
