import { memo, useEffect, useRef } from 'react'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'
import ImageKeyline from './ImageKeyline'

function WImageStatic({ params, parent, className, ...rest }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const targetRef = useRef<HTMLImageElement | null>(null)

  // A rotated or flipped image has to look the same here as it does on the
  // canvas, otherwise thumbnails and slides quietly straighten it out. Mirrors
  // what wImage does on mount: the box carries the rotation, the picture inside
  // it carries any crop/zoom transform.
  useEffect(() => {
    if (p.rotate && widgetRef.current) widgetRef.current.style.transform = `rotate(${p.rotate})`
    if (p.transform && targetRef.current) targetRef.current.style.transform = p.transform
  }, [p.rotate, p.transform])

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
    </div>
  )
}

export default memo(WImageStatic)
