import { memo, useEffect, useRef } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, controlState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { setUpdateRect } from '@/store/force'
import { lockWidgets, updateWidgetData, updateWidgetMultiple } from '@/store/widget/widget'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import ImageKeyline from './ImageKeyline'
import './wImage.less'

// A crop already made lives in the widget's own transform. It has to be read
// back when the widget mounts again — a page switch, a design reopened — since
// the first render writes the held position straight back out: starting from
// zero would quietly undo the crop.
function readHeldPosition(transform: string | undefined, zoomX: number, zoomY: number) {
  const found = /translate\(\s*(-?[\d.]+)px\s*,\s*(-?[\d.]+)px\s*\)/.exec(transform || '')
  if (!found) return { left: 0, top: 0 }
  return { left: Number(found[1]) * (zoomX || 1), top: Number(found[2]) * (zoomY || 1) }
}

/** The corner and edge grips of the crop frame, by the way each one moves it. */
const CROP_GRIPS: { dir: [number, number]; cursor: string }[] = [
  { dir: [-1, -1], cursor: 'nwse-resize' },
  { dir: [0, -1], cursor: 'ns-resize' },
  { dir: [1, -1], cursor: 'nesw-resize' },
  { dir: [-1, 0], cursor: 'ew-resize' },
  { dir: [1, 0], cursor: 'ew-resize' },
  { dir: [-1, 1], cursor: 'nesw-resize' },
  { dir: [0, 1], cursor: 'ns-resize' },
  { dir: [1, 1], cursor: 'nwse-resize' },
]

/** Design pixels. Small enough to crop hard, large enough to still grab. */
const MIN_CROP = 20

function clamp(value: number, low: number, high: number) {
  return Math.min(Math.max(value, low), Math.max(low, high))
}

function WImage({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any
  const control = useSnapshot(controlState)
  const canvas = useSnapshot(canvasState)
  const dropOverUuid = useSnapshot(widgetState).dDropOverUuid

  const widgetRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLImageElement | null>(null)
  const editBoxRef = useRef<HTMLDivElement | null>(null)
  const editBoxStyle = useRef<{ left: string; top: string; transform: string }>({ left: '', top: '', transform: '' })
  const cropWidgetXY = useRef({ x: 0, y: 0 })
  const holdPosition = useRef(readHeldPosition(params.transform, params.zoom, params.zoomY ?? params.zoom))
  const cropResize = useRef<{
    dir: [number, number]
    startX: number
    startY: number
    frame: { left: number; top: number; width: number; height: number }
    picture: { left: number; top: number; width: number; height: number }
  } | null>(null)
  const rotateTemp = useRef<any>(null)
  const flipTemp = useRef<string | null>(null)

  const cropEdit = params.uuid === control.dCropUuid
  const isMask = !!p.mask && dropOverUuid === params.uuid

  useEffect(() => {
    updateRecord()
    setUpdateRect()
  })

  // The crop scale is written straight to the widget's data and read back only
  // from callbacks, so nothing in the markup names it. Naming it here is what
  // subscribes this component to it: without that the slider moves, the number
  // changes and the picture keeps being drawn at the scale it had before.
  useEffect(() => {
    updateRecord()
  }, [p.zoom, p.zoomY])

  useEffect(() => {
    document.addEventListener('mouseup', touchend, false)
    return () => {
      document.removeEventListener('mouseup', touchend, false)
    }
  }, [])

  // Rebuilt from the store whenever it changes rather than once on mount, or an
  // undone rotation stays on screen: Moveable writes the turn straight to the
  // element, so nothing else puts it back. Cropping is left alone — fixRotate
  // straightens the image for the duration and puts the angle back after.
  useEffect(() => {
    const el = widgetRef.current
    if (!el || cropEdit) return
    el.style.transform = p.rotate ? `rotate(${p.rotate})` : ''
  }, [p.rotate, cropEdit])

  const lastCropEdit = useRef(cropEdit)
  useEffect(() => {
    if (lastCropEdit.current === cropEdit) return
    lastCropEdit.current = cropEdit
    const el = document.getElementById(`${params.uuid}`)
    if (cropEdit) {
      el?.addEventListener('mousedown', touchstart, false)
    } else {
      el?.removeEventListener('mousedown', touchstart, false)
    }
    fixRotate(cropEdit)
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

  function touchstart(e: MouseEvent) {
    // A grip is for reframing, not for sliding the picture about underneath.
    if ((e.target as HTMLElement)?.classList?.contains('crop__grip')) return
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
    changeFinish(left / (params.zoom || 1), top / ((params.zoomY ?? params.zoom) || 1))
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
    // Cropping with the grips can leave the picture wanting a different scale on
    // each axis, so the pair is written whenever the two differ.
    const zoomY = params.zoomY ?? params.zoom
    const scale = zoomY === params.zoom ? String(params.zoom) : `${params.zoom}, ${zoomY}`
    setEditBox('scale', scale)
    setTransform('scale', scale)
    handlemousemove()
  }

  /** Where the picture sits on the page, in design pixels, frame aside. */
  function pictureRect() {
    const width = params.width * (params.zoom || 1)
    const height = params.height * ((params.zoomY ?? params.zoom) || 1)
    return {
      width,
      height,
      left: params.left + params.width / 2 + holdPosition.current.left - width / 2,
      top: params.top + params.height / 2 + holdPosition.current.top - height / 2,
    }
  }

  function cropResizeStart(e: React.MouseEvent, dir: [number, number]) {
    e.preventDefault()
    cropResize.current = {
      dir,
      startX: e.pageX,
      startY: e.pageY,
      frame: { left: params.left, top: params.top, width: params.width, height: params.height },
      picture: pictureRect(),
    }
    document.addEventListener('mousemove', cropResizeMove, true)
    document.addEventListener('mouseup', cropResizeEnd, true)
  }

  function cropResizeMove(e: MouseEvent) {
    const drag = cropResize.current
    if (!drag) return
    e.stopPropagation()
    e.preventDefault()
    const { dir, frame, picture } = drag
    const dx = ((e.pageX - drag.startX) * 100) / canvasState.dZoom
    const dy = ((e.pageY - drag.startY) * 100) / canvasState.dZoom

    let { left, top, width, height } = frame
    if (dir[0] === -1) {
      left = clamp(frame.left + dx, picture.left, frame.left + frame.width - MIN_CROP)
      width = frame.left + frame.width - left
    } else if (dir[0] === 1) {
      width = clamp(frame.width + dx, MIN_CROP, picture.left + picture.width - frame.left)
    }
    if (dir[1] === -1) {
      top = clamp(frame.top + dy, picture.top, frame.top + frame.height - MIN_CROP)
      height = frame.top + frame.height - top
    } else if (dir[1] === 1) {
      height = clamp(frame.height + dy, MIN_CROP, picture.top + picture.height - frame.top)
    }

    // The picture is what stays still; the frame is the window moving over it.
    // That fixes the scale on each axis, and what is held is simply the distance
    // between the two centres.
    holdPosition.current = {
      left: picture.left + picture.width / 2 - (left + width / 2),
      top: picture.top + picture.height / 2 - (top + height / 2),
    }
    updateWidgetMultiple({
      uuid: params.uuid,
      data: [
        { key: 'left', value: left },
        { key: 'top', value: top },
        { key: 'width', value: width },
        { key: 'height', value: height },
        { key: 'zoom', value: picture.width / width },
        { key: 'zoomY', value: picture.height / height },
      ],
    })
  }

  function cropResizeEnd() {
    cropResize.current = null
    document.removeEventListener('mousemove', cropResizeMove, true)
    document.removeEventListener('mouseup', cropResizeEnd, true)
    setUpdateRect()
  }

  // Cropping is done on a straight, unflipped picture, so the turn and the flip
  // are held aside and handed back on the way out. Which way round that goes has
  // to follow the crop state: an image sitting at zero degrees was reading its
  // own held angle as "nothing held", straightening a second time and dropping
  // the flip for good.
  function fixRotate(isCrop: boolean) {
    if (isCrop) {
      rotateTemp.current = params.rotate
      widgetRef.current && (widgetRef.current.style.transform = `rotate(0deg)`)
      flipTemp.current = params.flip ?? null
      params.flip = null
    } else {
      widgetRef.current &&
        (widgetRef.current.style.transform = rotateTemp.current ? `rotate(${rotateTemp.current})` : '')
      params.flip = flipTemp.current
      rotateTemp.current = null
    }
    // The selection box stays away for the whole crop: its edges sit above the
    // grips and would take the mouse press meant for them, and the crop frame
    // draws its own outline anyway.
    setShowMoveable(false)
    if (!isCrop) {
      setTimeout(() => {
        setShowMoveable(true)
      }, 100)
    }
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
      {cropEdit ? (
        <div className="crop__grips" style={{ boxShadow: `0 0 0 ${100 / (canvas.dZoom || 100)}px #6ccfff` }}>
          {CROP_GRIPS.map(({ dir, cursor }) => (
            <div
              key={dir.join(',')}
              className="crop__grip"
              style={{
                left: `${(dir[0] + 1) * 50}%`,
                top: `${(dir[1] + 1) * 50}%`,
                cursor,
                // The canvas is scaled by the editor's zoom, so the grips are
                // scaled back out of it and stay the same size to grab at any zoom.
                transform: `scale(${100 / (canvas.dZoom || 100)})`,
              }}
              onMouseDown={(e) => cropResizeStart(e, dir)}
            />
          ))}
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
      <ImageKeyline params={p} />
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
