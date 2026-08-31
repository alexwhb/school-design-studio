import { useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'

type Props = {
  src?: string
  fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
  lazy?: boolean
  className?: string
  style?: React.CSSProperties
  alt?: string
  placeholder?: ReactNode
  onError?: () => void
  onClick?: (e: React.MouseEvent) => void
}

export default function Image({ src, fit, lazy, className, style, alt = '', placeholder, onError, onClick }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  return (
    <div className={cx('el-image', className || '')} style={style} onClick={onClick}>
      {failed ? (
        <div className="el-image__error">Failed</div>
      ) : (
        <>
          {placeholder && !loaded ? <div className="el-image__placeholder">{placeholder}</div> : null}
          <img
            className="el-image__inner"
            src={src}
            alt={alt}
            loading={lazy ? 'lazy' : undefined}
            style={{ ...(fit ? { objectFit: fit } : null), ...(placeholder && !loaded ? { display: 'none' } : null) }}
            onLoad={() => setLoaded(true)}
            onError={() => {
              setFailed(true)
              onError?.()
            }}
          />
        </>
      )}
    </div>
  )
}
