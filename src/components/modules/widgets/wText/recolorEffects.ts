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
 */
import { type TTextEffect } from './effectStyle'

const HEX = /^#?([0-9a-f]{6})([0-9a-f]{2})?$/i

/** `#rrggbb` or `#rrggbbaa` split into colour and alpha, or null if neither. */
function parse(value?: string) {
  const match = HEX.exec((value || '').trim())
  return match ? { rgb: match[1].toLowerCase(), alpha: (match[2] || 'ff').toLowerCase() } : null
}

export default function recolorEffects(effects: TTextEffect[], from?: string, to?: string): TTextEffect[] {
  const was = parse(from)
  const now = parse(to)
  // A fully transparent "old colour" is one the eye never tied to anything, so
  // matching on it would repaint every black part of the stack the moment the
  // text stopped being invisible.
  if (!was || !now || was.alpha === '00') return effects
  if (was.rgb === now.rgb && was.alpha === now.alpha) return effects

  const follow = (value?: string) => {
    const part = parse(value)
    if (!part || part.rgb !== was.rgb) return value
    return part.alpha === was.alpha ? `#${now.rgb}${now.alpha}` : `#${now.rgb}${part.alpha}`
  }

  return effects.map((layer) => {
    const next: TTextEffect = { ...layer }
    if (next.filling) {
      next.filling = { ...next.filling, color: follow(next.filling.color) as string }
      const stops = next.filling.gradient?.stops
      if (stops) {
        next.filling.gradient = {
          ...next.filling.gradient,
          stops: stops.map((stop: Record<string, any>) => ({ ...stop, color: follow(stop.color) })),
        }
      }
    }
    if (next.stroke) next.stroke = { ...next.stroke, color: follow(next.stroke.color) as string }
    if (next.shadow) next.shadow = { ...next.shadow, color: follow(next.shadow.color) as string }
    return next
  })
}
