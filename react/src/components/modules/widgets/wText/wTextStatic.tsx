import { memo, useEffect, useRef } from 'react'
import effectStyle from './effectStyle'
import type { WidgetProps } from '../types'

function WTextStatic({ params, parent, className, ...rest }: WidgetProps) {
  const p = params as any
  const widgetRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const el = widgetRef.current
    if (!el) return
    p.transform && (el.style.transform = p.transform)
    p.rotate && (el.style.transform += `translate(0px, 0px) rotate(${p.rotate}) scale(1, 1)`)
  }, [p.transform, p.rotate])

  const fontFamily = `'${p.fontClass.value}'`

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
        minWidth: p.fontSize + 'px',
        minHeight: p.fontSize * p.lineHeight + 'px',
        height: p.height + 'px',
        lineHeight: p.fontSize * p.lineHeight + 'px',
        letterSpacing: (p.fontSize * p.letterSpacing) / 100 + 'px',
        fontSize: p.fontSize + 'px',
        color: p.color,
        textAlign: p.textAlign,
        fontWeight: p.fontWeight,
        fontStyle: p.fontStyle,
        textDecoration: p.textDecoration,
        opacity: p.opacity,
        backgroundColor: p.backgroundColor,
        writingMode: p.writingMode,
        fontFamily,
      }}
    >
      {p.textEffects
        ? p.textEffects.map((ef: any, efi: number) => (
            <div
              key={efi + 'effect'}
              style={{ fontFamily, ...effectStyle(ef) }}
              className="edit-text effect-text"
              spellCheck={false}
              dangerouslySetInnerHTML={{ __html: p.text ?? '' }}
            />
          ))
        : null}
      <div style={{ fontFamily }} className="edit-text" spellCheck={false} dangerouslySetInnerHTML={{ __html: p.text ?? '' }} />
    </div>
  )
}

export default memo(WTextStatic)
