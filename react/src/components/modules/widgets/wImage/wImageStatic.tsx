import { memo } from 'react'
import { cx } from '@/utils/dom'
import type { WidgetProps } from '../types'

function WImageStatic({ params, parent }: WidgetProps) {
  const p = params as any
  return (
    <div
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
            className="target"
            style={{
              border: `${(p.height * p.sliceData.ratio) / 2}px solid transparent`,
              borderImage: `url('${p.imgUrl}') ${p.sliceData.left} round`,
            }}
          />
        ) : (
          <img className="target" style={{ transformOrigin: 'center' }} src={p.imgUrl} />
        )}
      </div>
    </div>
  )
}

export default memo(WImageStatic)
