import { RGBA2HexA } from './color'

export type GradientType = 'linear' | 'radial'

export type GradientStop = { color: string; offset: number }

export type ParsedGradient = {
  type: GradientType
  /** Degrees, CSS convention: 0 points up, and it turns clockwise. Ignored by a radial. */
  angle: number
  stops: GradientStop[]
}

/**
 * A radial gradient always runs from the middle of what it fills outwards, so
 * the picker has nothing here to offer and this never varies. It is written out
 * in full anyway, since it is also what is read back.
 */
const RADIAL_SHAPE = 'circle at 50% 50%'

export const isGradient = (value: string) => /^(linear|radial)-gradient\(/.test(value?.trim() || '')

export function toGradientString(type: GradientType, angle: number, stops: GradientStop[]) {
  const list = stops.map((stop) => `${stop.color} ${stop.offset * 100}%`).join(',')
  if (type === 'radial') return `radial-gradient(${RADIAL_SHAPE}, ${list})`
  return `linear-gradient(${angle}deg, ${list})`
}

/**
 * Splits a gradient's arguments on the commas that separate them, leaving alone
 * the commas inside `rgba(…)`. Splitting on every comma — which is what the
 * picker used to do — turns one `rgba(0, 0, 0, 1) 50%` stop into four.
 */
function splitArguments(body: string) {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < body.length; i += 1) {
    const char = body[i]
    if (char === '(') depth += 1
    else if (char === ')') depth -= 1
    else if (char === ',' && depth === 0) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  parts.push(body.slice(start))
  return parts.map((part) => part.trim()).filter(Boolean)
}

/** A stop's colour as `#rrggbbaa`, whatever notation it was written in. */
function toHexA(color: string) {
  if (color.startsWith('#')) return color.length === 7 ? color + 'ff' : color
  const [r = 0, g = 0, b = 0, a = 1] = (color.match(/[\d.]+/g) || []).map(Number)
  return RGBA2HexA(r, g, b, a)
}

/**
 * Reads a CSS gradient back into the angle and stops the picker edits.
 * Returns null for anything that is not a gradient, such as a flat colour.
 */
export function parseGradient(value: string): ParsedGradient | null {
  const match = /^(linear|radial)-gradient\((.*)\)\s*$/s.exec(value?.trim() || '')
  if (!match) return null

  const type = match[1] as GradientType
  const args = splitArguments(match[2])

  // The first argument says which way the gradient runs, but only if it is not
  // a stop. `linear-gradient(#000 0%, #fff 100%)` is legal, and CSS reads it as
  // 180deg, straight down.
  let angle = 180
  const head = args[0] || ''
  if (/^(-?[\d.]+deg|to\s|circle|ellipse|at\s|closest|farthest)/.test(head)) {
    args.shift()
    const degrees = /(-?[\d.]+)deg/.exec(head)
    if (degrees) angle = Number(degrees[1])
  }

  const stops: GradientStop[] = []
  args.forEach((arg, index) => {
    // The colour may itself hold spaces (`rgba(0, 0, 0, 1)` once the commas are
    // gone), so the position is taken off the end rather than split off the front.
    const position = /\s(-?[\d.]+)%\s*$/.exec(arg)
    const color = position ? arg.slice(0, position.index) : arg
    const offset = position ? Number(position[1]) / 100 : index / Math.max(1, args.length - 1)
    stops.push({ color: toHexA(color.trim()), offset })
  })

  return stops.length ? { type, angle, stops } : null
}
