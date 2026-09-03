/**
 * The CSS one layer of a stacked text effect turns into.
 *
 * Three places draw the same stack — the widget on the canvas, the static copy
 * the artboard strip renders, and the preview glyph in the settings panel —
 * and each used to inline its own copy of this expression. That is how the
 * preview came to be missing whatever the canvas had gained, so the stack
 * lives here now and they all read from it.
 *
 * `scale` is what the preview needs: it draws at 22px, so every distance has
 * to come down with the type or a 14px outline swallows the glyph.
 */
import type { CSSProperties } from 'react'
import getGradientOrImg from './getGradientOrImg'
import type { TPatternFill } from './patternFill'

export type TTextEffect = {
  filling?: { enable: boolean; type: number | string; color: string; gradient?: Record<string, any>; imageContent?: { image?: string; pattern?: TPatternFill } }
  stroke?: { enable: boolean; width: number; color: string; type?: string }
  shadow?: { enable: boolean; color: string; offsetX: number; offsetY: number; blur: number }
  offset?: { enable: boolean; x: number; y: number }
  skew?: { enable: boolean; x: number; y: number }
}

export default function effectStyle(effect: TTextEffect, scale = 1): CSSProperties {
  const { filling, stroke, shadow, offset, skew } = effect
  // A gradient or an image fill is painted as a background and clipped to the
  // glyphs, which only works if the text itself draws no colour.
  const solidFill = Boolean(filling?.enable) && Number(filling?.type) === 0
  const clippedFill = Boolean(filling?.enable) && !solidFill

  const transform = [offset?.enable ? `translate(${offset.x * scale}px, ${offset.y * scale}px)` : '', skew?.enable ? `skew(${skew.x}deg, ${skew.y}deg)` : ''].filter(Boolean).join(' ')

  return {
    color: solidFill ? filling?.color : 'transparent',
    WebkitTextStroke: stroke?.enable ? `${stroke.width * scale}px ${stroke.color}` : undefined,
    textShadow: shadow?.enable ? `${shadow.offsetX * scale}px ${shadow.offsetY * scale}px ${shadow.blur * scale}px ${shadow.color}` : undefined,
    backgroundImage: clippedFill ? getGradientOrImg(effect) : undefined,
    WebkitBackgroundClip: clippedFill ? 'text' : undefined,
    transform: transform || undefined,
    // Leaning a layer about its own middle slides it sideways as well as
    // tilting it; a cast shadow has to stay joined to the text it falls from,
    // so the skew pivots on the bottom of the box instead.
    transformOrigin: skew?.enable ? 'center bottom' : undefined,
  }
}
