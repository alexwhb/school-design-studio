/**
 * The colours an effect stack paints, as a list the panel can put swatches on.
 *
 * "Colour" is one control, and a preset is rarely one colour: a check is two
 * tones, a retro gradient is three bands, an extrude is a face over a body.
 * The text's own colour is carried through the stack by recolorEffects, so it
 * has a control already — but the colours the preset brought with it had none
 * anywhere in the panel, which is why changing the colour on those presets
 * moved a part of the artwork, or none of it.
 *
 * This is the rest of them. Each entry stands for every part of the stack
 * sharing those six hex digits, and changing one runs the same walk the text
 * colour runs, so a glow at 40% behind a face at 100% stays a glow at 40%.
 */
import { type TTextEffect } from './effectStyle'
import { parseColor } from './recolorEffects'

export type TEffectColor = {
  /** The six hex digits every part behind this swatch has in common. */
  rgb: string
  /** The alpha the swatch opens on: the most solid use of the colour. */
  alpha: string
  /** `#rrggbbaa`, for the swatch to show and the picker to open on. */
  value: string
}

export default function effectColors(effects: unknown, textColor?: string): TEffectColor[] {
  const stack = Array.isArray(effects) ? (effects as TTextEffect[]) : []
  // The Colour swatch above already carries the text's own colour wherever the
  // stack paints it, so listing it here as well would be two controls for one
  // colour. A transparent text colour paints nothing and claims nothing.
  const own = parseColor(textColor)
  const spokenFor = own && own.alpha !== '00' ? own.rgb : null

  const found = new Map<string, string>()
  const note = (value?: string) => {
    const part = parseColor(value)
    if (!part || part.alpha === '00' || part.rgb === spokenFor) return
    const seen = found.get(part.rgb)
    // The swatch opens on the most solid use of the colour. That is the one the
    // eye reads as "the colour", and it is the one the picker can show — a chip
    // of the same colour at 12% is an empty square.
    if (!seen || parseInt(part.alpha, 16) > parseInt(seen, 16)) found.set(part.rgb, part.alpha)
  }

  // Later layers paint over earlier ones, so the stack is walked back to front:
  // the face of the effect is what the first swatch should be.
  for (const layer of [...stack].reverse()) {
    const filling = layer.filling as Record<string, any> | undefined
    if (filling?.enable) {
      const type = Number(filling.type)
      if (type === 2) for (const stop of filling.gradient?.stops || []) note(stop.color)
      else if (type === 1) for (const color of filling.imageContent?.pattern?.colors || []) note(color)
      else note(filling.color)
    }
    if (layer.stroke?.enable) note(layer.stroke.color)
    if (layer.shadow?.enable) note(layer.shadow.color)
  }

  return [...found].map(([rgb, alpha]) => ({ rgb, alpha, value: `#${rgb}${alpha}` }))
}
