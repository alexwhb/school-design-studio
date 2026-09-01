/**
 * The text's colour, carried through its effect stack.
 *
 * A preset is drawn around one colour: the front face is that colour and the
 * glow, the cast shadow or the second copy behind it is the same colour again,
 * usually at a lower alpha. Change the text's colour on its own and only the
 * plain text underneath moves — the stack keeps painting the old colour over
 * the top, so the swatch looks like it does nothing at all.
 *
 * So every part of the stack that was the old colour follows the new one, and
 * a part that was some other colour — a white outline, a black drop shadow —
 * is left where it is. Alpha belongs to the part rather than to the colour: a
 * glow is the text colour at 40% and has to stay at 40% afterwards. A part
 * that matched the old colour exactly, alpha included, takes the new colour
 * whole instead, so picking a translucent colour still reaches the front face.
 *
 * The colours a preset brought with it that were never the text's own — the
 * second tone of a check, the middle band of a three-colour gradient — are
 * reached the same way, through the palette in effectColors.ts, which calls
 * the walk below directly.
 */
import { type TTextEffect } from './effectStyle'

const HEX = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i

export type TColorParts = { rgb: string; alpha: string }

/** `#rrggbb` or `#rrggbbaa` split into colour and alpha, or null if neither. */
export function parseColor(value?: string): TColorParts | null {
  const match = HEX.exec((value || '').trim())
  return match ? { rgb: match[1].toLowerCase(), alpha: (match[2] || 'ff').toLowerCase() } : null
}

/** Every part of the stack painted `was` painted `now` instead. */
export function replaceEffectColor(effects: TTextEffect[], was: TColorParts, now: TColorParts): TTextEffect[] {
  const follow = (value?: string) => {
    const part = parseColor(value)
    if (!part || part.rgb !== was.rgb) return value
    return part.alpha === was.alpha ? `#${now.rgb}${now.alpha}` : `#${now.rgb}${part.alpha}`
  }

  return effects.map((layer) => {
    const next: TTextEffect = { ...layer }
    if (next.filling) {
      const filling: Record<string, any> = { ...next.filling }
      const stops = filling.gradient?.stops
      if (stops) {
        filling.gradient = {
          ...filling.gradient,
          stops: stops.map((stop: Record<string, any>) => ({ ...stop, color: follow(stop.color) })),
        }
      }
      const pattern = filling.imageContent?.pattern
      if (pattern?.colors) {
        const colors = pattern.colors.map((color: string) => follow(color))
        filling.imageContent = { ...filling.imageContent, pattern: { ...pattern, colors } }
        // A tiling fill paints its tile, never `color` — but `color` is still
        // the flat fallback the panel and a renderer that cannot clip a
        // background to text fall back to, so it tracks the leading tone
        // rather than being followed on its own and left disagreeing with the
        // tile it stands for.
        filling.color = colors[0]
      } else {
        filling.color = follow(filling.color)
      }
      next.filling = filling as TTextEffect['filling']
    }
    if (next.stroke) next.stroke = { ...next.stroke, color: follow(next.stroke.color) as string }
    if (next.shadow) next.shadow = { ...next.shadow, color: follow(next.shadow.color) as string }
    return next
  })
}

export default function recolorEffects(effects: TTextEffect[], from?: string, to?: string): TTextEffect[] {
  const was = parseColor(from)
  const now = parseColor(to)
  // A fully transparent "old colour" is one the eye never tied to anything, so
  // matching on it would repaint every black part of the stack the moment the
  // text stopped being invisible.
  if (!was || !now || was.alpha === '00') return effects
  if (was.rgb === now.rgb && was.alpha === now.alpha) return effects

  return replaceEffectColor(effects, was, now)
}
