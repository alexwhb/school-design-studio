/**
 * How round the corners of a drawn box are.
 *
 * One number when every corner is the same, which is the usual case and all a
 * design saved before this existed could hold — so `radii` is absent rather
 * than four copies of `radius`, and every reader has to treat absent and "four
 * of the same" as the same thing. `readCorners` does, and it is the only way
 * the canvas, the export, the panel and the corner grips read a box: four
 * numbers, already clamped to what will actually fit.
 *
 * The order is CSS's — top-left, top-right, bottom-right, bottom-left, clockwise
 * from the top-left — so `cornersCss` is a join and never a re-order.
 */

export type TCorners = [number, number, number, number]

/** Which corner of the box each slot describes, and where it sits on it. */
export const CORNERS = [
  { key: 'tl', label: 'Top left', short: 'TL', right: false, bottom: false },
  { key: 'tr', label: 'Top right', short: 'TR', right: true, bottom: false },
  { key: 'br', label: 'Bottom right', short: 'BR', right: true, bottom: true },
  { key: 'bl', label: 'Bottom left', short: 'BL', right: false, bottom: true },
] as const

/**
 * The largest radius a corner may take: half the shorter side, at which point
 * the box is a stadium. Past it the browser scales every corner down to fit,
 * which reads on screen as the radius quietly refusing to change.
 */
export function maxRadius(width: unknown, height: unknown): number {
  return Math.max(0, Math.min(Number(width) || 0, Number(height) || 0) / 2)
}

function clamp(value: unknown, limit: number): number {
  return Math.min(Math.max(Number(value) || 0, 0), limit)
}

/** The four corners a box actually draws, whichever way it holds them. */
export function readCorners(params: Record<string, any> | null | undefined): TCorners {
  const limit = maxRadius(params?.width, params?.height)
  const held = params?.radii
  if (Array.isArray(held) && held.length === 4) {
    return [clamp(held[0], limit), clamp(held[1], limit), clamp(held[2], limit), clamp(held[3], limit)]
  }
  const uniform = clamp(params?.radius, limit)
  return [uniform, uniform, uniform, uniform]
}

/** True while the corners are held apart, and each grip moves only its own. */
export function isUnlinked(params: Record<string, any> | null | undefined): boolean {
  const held = params?.radii
  return Array.isArray(held) && held.length === 4
}

export function cornersCss(corners: TCorners): string {
  return corners.map((value) => `${value}px`).join(' ')
}
