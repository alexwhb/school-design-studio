import { memo, useEffect, useMemo, useRef } from 'react'
import type { Options } from 'qr-code-styling'
import QrCode from '@/components/business/qrcode/QrCode'
import type { WidgetProps } from '../types'

/**
 * Read-only twin of wQrcode.
 *
 * The editing component reports its measured size back to the store and pokes
 * moveable on every update, which is exactly what a page thumbnail or a slide
 * must not do. This renders the same QR code and nothing else.
 */
function WQrcodeStatic({ params, parent, className, ...rest }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const width = Number(p.width)

  const dotsOptions = useMemo<Options['dotsOptions']>(
    () => ({
      type: p.dotType,
      color: p.dotColor,
      gradient: {
        type: 'linear',
        rotation: p.dotRotation,
        colorStops: [
          { offset: 0, color: p.dotColor },
          { offset: 1, color: p.dotColorType === 'single' ? p.dotColor : p.dotColor2 },
        ],
      },
    }),
    [p.dotType, p.dotColor, p.dotColor2, p.dotColorType, p.dotRotation],
  )

  useEffect(() => {
    if (p.rotate && widgetRef.current) widgetRef.current.style.transform = `rotate(${p.rotate})`
  }, [p.rotate])

  return (
    <div
      {...rest}
      ref={widgetRef}
      className={className}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        height: p.height + 'px',
        opacity: p.opacity,
      }}
    >
      <QrCode className="target" width={width} height={width} image={p.url} value={p.value} dotsOptions={dotsOptions} />
    </div>
  )
}

export default memo(WQrcodeStatic)
