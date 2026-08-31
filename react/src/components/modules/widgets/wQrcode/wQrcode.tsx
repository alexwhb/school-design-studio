import { memo, useEffect, useMemo, useRef } from 'react'
import { useSnapshot } from 'valtio'
import type { Options } from 'qr-code-styling'
import QrCode from '@/components/business/qrcode/QrCode'
import { setUpdateRect } from '@/store/force'
import { widgetState } from '@/store/state'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'

function WQrcode({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const mounted = useRef(false)
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
    updateRecord()
    setUpdateRect()
  })

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    if (widgetRef.current) {
      params.rotate && (widgetRef.current.style.transform += `rotate(${params.rotate})`)
    }
  }, [params])

  function updateRecord() {
    const active = widgetState.dActiveElement
    if (active?.uuid === params.uuid) {
      const record = active.record
      if (!widgetRef.current) return
      record.width = widgetRef.current.offsetWidth
      record.height = widgetRef.current.offsetHeight
    }
  }

  return (
    <div
      {...rest}
      id={id ?? `${params.uuid}`}
      ref={widgetRef}
      className={cx('w-qrcode', { 'layer-lock': !!p.lock }, className || '')}
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

export default memo(WQrcode)
