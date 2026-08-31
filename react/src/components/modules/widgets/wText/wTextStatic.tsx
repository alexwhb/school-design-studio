import { memo, useEffect, useRef } from 'react'
import getGradientOrImg from './getGradientOrImg'
import type { WidgetProps } from '../types'

function WTextStatic({ params, parent }: WidgetProps) {
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
      ref={widgetRef}
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
              style={{
                fontFamily,
                color: ef.filling && ef.filling.enable && ef.filling.type === 0 ? ef.filling.color : 'transparent',
                WebkitTextStroke: ef.stroke && ef.stroke.enable ? `${ef.stroke.width}px ${ef.stroke.color}` : undefined,
                textShadow:
                  ef.shadow && ef.shadow.enable
                    ? `${ef.shadow.offsetX}px ${ef.shadow.offsetY}px ${ef.shadow.blur}px ${ef.shadow.color}`
                    : undefined,
                backgroundImage: ef.filling && ef.filling.enable ? (ef.filling.type === 0 ? undefined : getGradientOrImg(ef)) : undefined,
                WebkitBackgroundClip: ef.filling && ef.filling.enable ? (ef.filling.type === 0 ? undefined : 'text') : undefined,
                transform: ef.offset && ef.offset.enable ? `translate(${ef.offset.x}px, ${ef.offset.y}px)` : undefined,
              }}
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
