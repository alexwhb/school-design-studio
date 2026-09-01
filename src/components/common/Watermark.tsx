import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react'

const FontGap = 3

type WatermarkFont = {
  color: string
  fontSize: number
  fontStyle: string
  fontWeight: string
  fontFamily: string
  textAlign: CanvasTextAlign
  textBaseline: CanvasTextBaseline
}

export type WatermarkProps = {
  content?: string | string[]
  image?: string
  width?: number
  height?: number
  rotate?: number
  zIndex?: number
  gap?: [number, number]
  offset?: [number, number]
  font?: Partial<WatermarkFont>
  style?: CSSProperties
  className?: string
  children?: ReactNode
}

function prepareCanvas(width: number, height: number, ratio = 1): [CanvasRenderingContext2D, HTMLCanvasElement, number, number] {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  const realWidth = width * ratio
  const realHeight = height * ratio
  canvas.setAttribute('width', `${realWidth}px`)
  canvas.setAttribute('height', `${realHeight}px`)
  ctx.save()
  return [ctx, canvas, realWidth, realHeight]
}

function getClips(
  content: string | string[] | HTMLImageElement,
  rotate: number,
  ratio: number,
  width: number,
  height: number,
  font: WatermarkFont,
  gapX: number,
  gapY: number,
): [string, number, number] {
  const [ctx, canvas, contentWidth, contentHeight] = prepareCanvas(width, height, ratio)
  if (content instanceof HTMLImageElement) {
    ctx.drawImage(content, 0, 0, contentWidth, contentHeight)
  } else {
    const { color, fontSize, fontStyle, fontWeight, fontFamily, textAlign, textBaseline } = font
    const mergedFontSize = Number(fontSize) * ratio
    ctx.font = `${fontStyle} normal ${fontWeight} ${mergedFontSize}px/${height}px ${fontFamily}`
    ctx.fillStyle = color
    ctx.textAlign = textAlign
    ctx.textBaseline = textBaseline
    const contents = Array.isArray(content) ? content : [content]
    contents?.forEach((item, index) => {
      ctx.fillText(item ?? '', contentWidth / 2, index * (mergedFontSize + FontGap * ratio))
    })
  }
  const angle = (Math.PI / 180) * Number(rotate)
  const maxSize = Math.max(width, height)
  const [rCtx, rCanvas, realMaxSize] = prepareCanvas(maxSize, maxSize, ratio)
  rCtx.translate(realMaxSize / 2, realMaxSize / 2)
  rCtx.rotate(angle)
  if (contentWidth > 0 && contentHeight > 0) {
    rCtx.drawImage(canvas, -contentWidth / 2, -contentHeight / 2)
  }
  function getRotatePos(x: number, y: number) {
    const targetX = x * Math.cos(angle) - y * Math.sin(angle)
    const targetY = x * Math.sin(angle) + y * Math.cos(angle)
    return [targetX, targetY]
  }
  let left = 0
  let right = 0
  let top = 0
  let bottom = 0
  const halfWidth = contentWidth / 2
  const halfHeight = contentHeight / 2
  const points = [
    [0 - halfWidth, 0 - halfHeight],
    [0 + halfWidth, 0 - halfHeight],
    [0 + halfWidth, 0 + halfHeight],
    [0 - halfWidth, 0 + halfHeight],
  ]
  points.forEach(([x, y]) => {
    const [targetX, targetY] = getRotatePos(x, y)
    left = Math.min(left, targetX)
    right = Math.max(right, targetX)
    top = Math.min(top, targetY)
    bottom = Math.max(bottom, targetY)
  })
  const cutLeft = left + realMaxSize / 2
  const cutTop = top + realMaxSize / 2
  const cutWidth = right - left
  const cutHeight = bottom - top
  const realGapX = gapX * ratio
  const realGapY = gapY * ratio
  const filledWidth = (cutWidth + realGapX) * 2
  const filledHeight = cutHeight + realGapY
  const [fCtx, fCanvas] = prepareCanvas(filledWidth, filledHeight)
  function drawImg(targetX = 0, targetY = 0) {
    fCtx.drawImage(rCanvas, cutLeft, cutTop, cutWidth, cutHeight, targetX, targetY, cutWidth, cutHeight)
  }
  drawImg()
  drawImg(cutWidth + realGapX, -cutHeight / 2 - realGapY / 2)
  drawImg(cutWidth + realGapX, +cutHeight / 2 + realGapY / 2)
  return [fCanvas.toDataURL(), filledWidth / ratio, filledHeight / ratio]
}

export default function Watermark({
  content,
  image,
  width,
  height,
  rotate = -22,
  zIndex = 9,
  gap = [100, 100],
  offset,
  font,
  style,
  className,
  children,
}: WatermarkProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const watermarkRef = useRef<HTMLDivElement | undefined>(undefined)

  const gapX = gap[0]
  const gapY = gap[1]

  useEffect(() => {
    const merged: WatermarkFont = {
      color: font?.color ?? 'rgba(0,0,0,.15)',
      fontSize: font?.fontSize ?? 16,
      fontWeight: font?.fontWeight ?? 'normal',
      fontStyle: font?.fontStyle ?? 'normal',
      fontFamily: font?.fontFamily ?? 'sans-serif',
      textAlign: font?.textAlign ?? 'center',
      textBaseline: font?.textBaseline ?? 'top',
    }

    const gapXCenter = gapX / 2
    const gapYCenter = gapY / 2
    const offsetLeft = offset?.[0] ?? gapXCenter
    const offsetTop = offset?.[1] ?? gapYCenter

    function getMarkStyle() {
      const markStyle: Record<string, any> = {
        zIndex,
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        backgroundRepeat: 'repeat',
      }
      let positionLeft = offsetLeft - gapXCenter
      let positionTop = offsetTop - gapYCenter
      if (positionLeft > 0) {
        markStyle.left = `${positionLeft}px`
        markStyle.width = `calc(100% - ${positionLeft}px)`
        positionLeft = 0
      }
      if (positionTop > 0) {
        markStyle.top = `${positionTop}px`
        markStyle.height = `calc(100% - ${positionTop}px)`
        positionTop = 0
      }
      markStyle.backgroundPosition = `${positionLeft}px ${positionTop}px`
      return markStyle
    }

    function destroy() {
      if (watermarkRef.current) {
        watermarkRef.current.remove()
        watermarkRef.current = undefined
      }
    }

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!watermarkRef.current) {
      watermarkRef.current = document.createElement('div')
    }
    const ratio = window.devicePixelRatio || 1

    let defaultWidth = 120
    let defaultHeight = 64
    if (!image && ctx.measureText) {
      ctx.font = `${Number(merged.fontSize)}px ${merged.fontFamily}`
      const contents = Array.isArray(content) ? content : [content ?? '']
      const sizes = contents.map((item) => {
        const metrics = ctx.measureText(item as string)
        return [
          metrics.width,
          metrics.fontBoundingBoxAscent !== undefined
            ? metrics.fontBoundingBoxAscent + metrics.fontBoundingBoxDescent
            : metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
        ]
      })
      defaultWidth = Math.ceil(Math.max(...sizes.map((size) => size[0])))
      defaultHeight = Math.ceil(Math.max(...sizes.map((size) => size[1]))) * contents.length + (contents.length - 1) * FontGap
    }
    const markWidth = width ?? defaultWidth
    const markHeight = height ?? defaultHeight

    const drawCanvas = (drawContent: string | string[] | HTMLImageElement) => {
      const [textClips, clipWidth] = getClips(drawContent || '', rotate, ratio, markWidth, markHeight, merged, gapX, gapY)
      if (containerRef.current && watermarkRef.current) {
        Object.assign(watermarkRef.current.style, {
          ...getMarkStyle(),
          backgroundImage: `url('${textClips}')`,
          backgroundSize: `${Math.floor(clipWidth)}px`,
        })
        containerRef.current.append(watermarkRef.current)
      }
    }

    if (image) {
      const img = new Image()
      img.onload = () => drawCanvas(img)
      img.onerror = () => drawCanvas(content ?? '')
      img.crossOrigin = 'anonymous'
      img.referrerPolicy = 'no-referrer'
      img.src = image
    } else {
      drawCanvas(content ?? '')
    }

    return destroy
  }, [content, image, width, height, rotate, zIndex, gapX, gapY, offset, font])

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative', ...style }}>
      {children}
    </div>
  )
}
