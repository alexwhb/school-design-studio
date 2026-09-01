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
            // Hidden by the opacity Element Plus gives is-loading, never by
            // display: none. A display: none image is never near the viewport,
            // so loading="lazy" will not fetch it, so it never loads, so it is
            // never shown — the placeholder is all you ever see.
            className={cx('el-image__inner', { 'is-loading': !!placeholder && !loaded })}
            src={src}
            alt={alt}
            loading={lazy ? 'lazy' : undefined}
            style={fit ? { objectFit: fit } : undefined}
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
