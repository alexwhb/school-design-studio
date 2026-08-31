import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, controlState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { setUpdateRect } from '@/store/force'
import { lockWidgets, updateWidgetData } from '@/store/widget/widget'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import './wImage.less'

function WImage({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any
  const control = useSnapshot(controlState)
  const dropOverUuid = useSnapshot(widgetState).dDropOverUuid

  const widgetRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLImageElement | null>(null)
  const editBoxRef = useRef<HTMLDivElement | null>(null)
  const editBoxStyle = useRef<{ left: string; top: string; transform: string }>({ left: '', top: '', transform: '' })
  const cropWidgetXY = useRef({ x: 0, y: 0 })
  const holdPosition = useRef({ left: 0, top: 0 })
  const rotateTemp = useRef<any>(null)
  const flipTemp = useRef<string | null>(null)
  const mounted = useRef(false)

  const cropEdit = params.uuid === control.dCropUuid
  const isMask = !!p.mask && dropOverUuid === params.uuid

  useEffect(() => {
    updateRecord()
    setUpdateRect()
  })

  useEffect(() => {
    document.addEventListener('mouseup', touchend, false)
    return () => {
      document.removeEventListener('mouseup', touchend, false)
    }
  }, [])

  useEffect(() => {
    const el = widgetRef.current
    if (!el || mounted.current) return
    mounted.current = true
    params.rotate && (el.style.transform += `rotate(${params.rotate})`)
  }, [params])

  const firstCropRun = useRef(true)
  useEffect(() => {
    if (firstCropRun.current) {
      firstCropRun.current = false
      return
    }
    const el = document.getElementById(`${params.uuid}`)
    if (cropEdit) {
      el?.addEventListener('mousedown', touchstart, false)
    } else {
      el?.removeEventListener('mousedown', touchstart, false)
    }
    fixRotate()
    lockOthers(cropEdit)
    return () => {
      el?.removeEventListener('mousedown', touchstart, false)
    }
  }, [cropEdit])

  function applyEditBox() {
    const el = editBoxRef.current
    if (!el) return
    el.style.left = editBoxStyle.current.left
    el.style.top = editBoxStyle.current.top
    el.style.transform = editBoxStyle.current.transform
  }

  function touchstart() {
    const editBox = document.getElementById(params.uuid + '_ebox')
    cropWidgetXY.current = {
      x: Number(editBox?.style.left.replace('px', '')) || 0,
      y: Number(editBox?.style.top.replace('px', '')) || 0,
    }
    document.addEventListener('mousemove', handlemousemove, true)
  }

  function touchend() {
    document.removeEventListener('mousemove', handlemousemove, true)
  }

  function handlemousemove(e?: MouseEvent) {
    const next = move(e)
    if (!next) return
    e && e.stopPropagation()
    e && e.preventDefault()
    const { left, top } = next
    holdPosition.current = { left, top }
    editBoxStyle.current.left = left + 'px'
    editBoxStyle.current.top = top + 'px'
    applyEditBox()
    changeFinish(left / params.zoom, top / params.zoom)
  }

  function changeFinish(x: number, y: number) {
    setTransform('translate', `${x}px, ${y}px`)
  }

  function move(payload?: MouseEvent) {
    if (payload) {
      const widgetXY = { x: cropWidgetXY.current.x, y: cropWidgetXY.current.y }
      const dx = Number(payload.pageX) - widgetState.dMouseXY.x
      const dy = Number(payload.pageY) - widgetState.dMouseXY.y
      const left = Number(widgetXY.x) + Math.floor((dx * 100) / canvasState.dZoom)
      const top = Number(widgetXY.y) + Math.floor((dy * 100) / canvasState.dZoom)
      return { left, top }
    }
    return holdPosition.current
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

  function setTransform(attrName: string, value: string | number) {
    const iof = params.transform!.indexOf(attrName)
    let setValue = ''
    if (iof !== -1) {
      const index = iof + attrName.length
      const tf = params.transform!
      const FRONT = tf.slice(0, index + 1)
      const half = tf.substring(index + 1)
      const END = half.substring(half.indexOf(')'))
      setValue = FRONT + value + END
    } else {
      setValue = params.transform + ` ${attrName}(${value})`
    }
    updateWidgetData({ uuid: params.uuid, key: 'transform', value: setValue })
    if (params.transform && targetRef.current) {
      targetRef.current.style.transform = params.transform
    }
  }

  function setEditBox(attrName: string, value: string | number) {
    const iof = editBoxStyle.current.transform?.indexOf(attrName)
    let setValue = ''
    if (iof !== -1 && iof !== undefined) {
      const index = iof + attrName.length
      const tf = editBoxStyle.current.transform ?? ''
      const FRONT = tf.slice(0, index + 1)
      const half = tf.substring(index + 1)
      const END = half.substring(half.indexOf(')'))
      setValue = FRONT + value + END
    } else {
      setValue = editBoxStyle.current.transform + ` ${attrName}(${value})`
    }
    editBoxStyle.current.transform = setValue
    applyEditBox()
  }

  function updateZoom() {
    setEditBox('scale', params.zoom)
    setTransform('scale', params.zoom)
    handlemousemove()
  }

  function fixRotate() {
    if (rotateTemp.current) {
      widgetRef.current && (widgetRef.current.style.transform = `rotate(${rotateTemp.current})`)
      params.flip = flipTemp.current
      rotateTemp.current = null
    } else {
      rotateTemp.current = params.rotate
      widgetRef.current && (widgetRef.current.style.transform = `rotate(0deg)`)
      flipTemp.current = params.flip ?? null
      params.flip = null
    }
    setShowMoveable(false)
    setTimeout(() => {
      setShowMoveable(true)
    }, 100)
  }

  function lockOthers(isCrop: boolean) {
    lockWidgets()
    if (!isCrop) return
    for (const widget of widgetState.dWidgets) {
      if (widget.uuid === params.uuid) {
        widget.lock = false
        break
      }
    }
  }

  return (
    <div
      {...rest}
      id={id ?? params.uuid}
      ref={widgetRef}
      className={cx('w-image', { 'layer-lock': !!p.lock }, className || '')}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      {cropEdit ? (
        <div id={params.uuid + '_ebox'} ref={editBoxRef} className="svg__edit__wrap" style={{ transformOrigin: 'center' }}>
          <img className="edit__model" src={p.imgUrl} />
        </div>
      ) : null}
      <div
        style={{
          transform: p.flip ? `rotate${p.flip}(180deg)` : undefined,
          borderRadius: p.radius + 'px',
          WebkitMaskImage: `${p.mask ? `url('${p.mask}')` : 'initial'}`,
        }}
        className={cx('img__box', { mask: !!p.mask })}
      >
        {p.isNinePatch ? (
          <div
            ref={targetRef as any}
            className="target"
            style={{
              border: `${(p.height * p.sliceData.ratio) / 2}px solid transparent`,
              borderImage: `url('${p.imgUrl}') ${p.sliceData.left} round`,
            }}
          />
        ) : (
          <img ref={targetRef} className="target" style={{ transformOrigin: 'center' }} src={p.imgUrl} />
        )}
      </div>
      {isMask ? (
        <div className="drop__mask">
          <div {...({ putIn: 'true' } as any)} style={{ fontSize: p.width / 12 + 'px' }} className="drop__btn">
            Drop here
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default memo(WImage)
