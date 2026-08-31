import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { widgetState } from '@/store/state'
import { updateWidgetData } from '@/store/widget/widget'
import { cx, setTransformAttribute } from '@/utils/dom'
import type { WidgetProps } from '../types'
import './wGroup.less'

function WGroup({ params, parent, id, className, child, children, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any

  const widgetRef = useRef<HTMLDivElement | null>(null)
  const ratio = useRef(0)
  const temp = useRef<Record<string, any>>({})
  const compWidgetsRecord = useRef<Record<string, any>>({})
  const mounted = useRef(false)

  useEffect(() => {
    updateRecord()
  })

  useEffect(() => {
    touchstart()
    document.addEventListener('mousedown', touchstart, false)
    document.addEventListener('mouseup', touchend, false)
    if (!mounted.current) {
      mounted.current = true
      if (params.rotate && widgetRef.current) {
        widgetRef.current.style.transformOrigin = 'left top'
        widgetRef.current.style.transform += `rotate(${params.rotate})`
      }
    }
    return () => {
      document.removeEventListener('mousedown', touchstart, false)
      document.removeEventListener('mouseup', touchend, false)
    }
  }, [params])

  function updateRecord(tempScale?: number) {
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid) {
      const record = active.record
      if (record?.width <= 0) {
        touchend()
      }
      ratio.current = tempScale || (params.width || 0) / record?.width

      if (ratio.current != 1) {
        if (record?.width != 0) {
          for (let i = widgetState.dWidgets.length - 1; i >= 0; --i) {
            const w = widgetState.dWidgets[i]
            if (w.parent === params.uuid) {
              temp.current[w.uuid] = { width: w.width * ratio.current, height: w.height * ratio.current, raw: w }
            }
          }
        }
        if (widgetRef.current) {
          widgetRef.current.style.transformOrigin = 'left top'
          setTransformAttribute(widgetRef.current, 'scale', ratio.current)
        }
      }
    }
  }

  function touchstart() {
    if (widgetState.dActiveElement?.uuid !== params.uuid) {
      return
    }
    for (let i = widgetState.dWidgets.length - 1; i >= 0; --i) {
      const w = widgetState.dWidgets[i]
      if (w.parent === params.uuid) {
        const el = document.getElementById(w.uuid)
        if (el) {
          compWidgetsRecord.current[w.uuid] = {
            left: Number(el.style.left.replace('px', '')),
            top: Number(el.style.top.replace('px', '')),
            fontSize: Number(el.style.fontSize?.replace('px', '')),
          }
        }
      }
    }
  }

  function touchend() {
    if (widgetState.dActiveElement?.uuid !== params.uuid) {
      return
    }
    setTimeout(() => {
      if (!temp.current || !widgetRef.current) {
        return
      }
      widgetRef.current.style.opacity = `${0}`
      setTransformAttribute(widgetRef.current, 'scale', 1)
      setTimeout(() => {
        if (!widgetRef.current) return
        widgetRef.current.style.opacity = `${params.opacity}`
      }, 100)

      for (const key in temp.current) {
        if (Object.hasOwnProperty.call(temp.current, key)) {
          keyChange(key, 'width', temp.current[key].width)
          keyChange(key, 'height', temp.current[key].height)
          keySetValue(key, 'left', compWidgetsRecord.current[key]?.left * ratio.current)
          keySetValue(key, 'top', compWidgetsRecord.current[key]?.top * ratio.current)
          if (temp.current[key].raw.type === 'w-text') {
            keyChange(key, 'fontSize', compWidgetsRecord.current[key]?.fontSize * ratio.current)
          }
        }
      }
      temp.current = {}
      const active = widgetState.dActiveElement
      if (!active) return
      if (active.uuid === params.uuid) {
        const record = active.record
        record.width = widgetRef.current?.offsetWidth
        record.height = widgetRef.current?.offsetHeight
        active.width = widgetRef.current?.offsetWidth as number
        active.height = widgetRef.current?.offsetHeight as number
      }
    }, 10)
  }

  function keyChange(uuid: string, key: string, value: number) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  function keySetValue(uuid: string, key: string, value: number) {
    setTimeout(() => {
      const widget = widgetState.dWidgets.find((item) => item.uuid === uuid)
      if (!widget) return
      ;(widget as any)[key] = value + Number((params as any)[key] || '')
    }, 10)
  }

  return (
    <div
      {...rest}
      id={id ?? params.uuid}
      ref={widgetRef}
      className={cx('w-group', { 'layer-lock': !!p.lock }, className || '')}
      style={{
        position: 'absolute',
        left: (p.left || 0) - (parent?.left || 0) + 'px',
        top: (p.top || 0) - (parent?.top || 0) + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      {children}
    </div>
  )
}

export default memo(WGroup)
