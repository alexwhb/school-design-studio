/**
 * What can be put on the ends of a line: an arrowhead, a dot, a bar.
 *
 * An end belongs to an open path only. A closed one has no ends to put anything
 * on, so the readers here treat a closed path as bare whatever it carries, and
 * a path closed from the panel keeps its ends in case it is opened again.
 *
 * The ends are ordinary SVG geometry rather than `<marker>`s. A marker is drawn
 * by the browser but not by html2canvas, which walks the DOM itself and has no
 * SVG renderer at all; the export gets round that by serialising the whole
 * `<svg>` into an `<img>`, and a polygon or a circle inside it comes through
 * that door the same as the path does. Sized from the stroke and painted with
 * it, so a thicker or recoloured line takes its heads with it.
 *
 * A head has width, and a line has none, so a frame fitted round the line alone
 * would cut the head off along a horizontal or vertical line — the frame is
 * only as tall as the stroke. `endsPad` is the extra room the frame is given on
 * every side, over and above the half-stroke every path gets; `paintBox` takes
 * it back off, so the line is still drawn where it was pulled.
 */
import { absolutePoints, pathD, type TPaintBox, type TPathPoint } from './pathGeometry'

export type TLineEnd = 'arrow' | 'triangle' | 'circle' | 'bar'

/** In the order the panel lists them, with what it calls each. */
export const LINE_ENDS: { value: TLineEnd; label: string }[] = [
  { value: 'arrow', label: 'Arrow' },
  { value: 'triangle', label: 'Triangle' },
  { value: 'circle', label: 'Circle' },
  { value: 'bar', label: 'Bar' },
]

export type TLineEnds = { start: TLineEnd | null; end: TLineEnd | null }

const KINDS = new Set<string>(LINE_ENDS.map((end) => end.value))

function readEnd(value: unknown): TLineEnd | null {
  return typeof value === 'string' && KINDS.has(value) ? (value as TLineEnd) : null
}

/** The ends a widget asks for. Absent, unknown, or on a closed path all read as none. */
export function readLineEnds(params: Record<string, any> | null | undefined): TLineEnds {
  if (!params || params.closed) return { start: null, end: null }
  return { start: readEnd(params.lineStart), end: readEnd(params.lineEnd) }
}

export function hasLineEnds(params: Record<string, any> | null | undefined): boolean {
  const ends = readLineEnds(params)
  return !!(ends.start || ends.end)
}

/**
 * How big a head is for a stroke this thick, in design pixels: four strokes
 * long and as wide, with a floor so a hairline still gets a head you can see.
 */
export function headSize(strokeWidth: number) {
  const length = Math.max(strokeWidth * 4, 6)
  return { length, halfWidth: length / 2 }
}

/**
 * The room a path's frame keeps round the curve for its heads, beyond the half
 * stroke it keeps anyway. Zero for a path with no ends, which is every path
 * drawn before ends existed.
 */
export function endsPad(params: Record<string, any> | null | undefined): number {
  if (!hasLineEnds(params)) return 0
  const stroke = Number(params?.borderWidth) || 0
  // A head's widest point is half its width out from the line, plus half a
  // stroke for the round cap or join on its corners.
  return headSize(stroke).halfWidth + stroke / 2
}

export type TLineHead = {
  kind: TLineEnd
  /** Where the line ends, in the widget's own pixels. */
  x: number
  y: number
  /** Which way the head points, in radians, outward along the line. */
  angle: number
}

type TXY = { x: number; y: number }

/** The direction a path leaves its first point, or arrives at its last, as a unit vector pointing outward. */
function outwardAt(points: TPathPoint[], which: 'start' | 'end'): TXY | null {
  if (points.length < 2) return null
  const index = which === 'start' ? 0 : points.length - 1
  const neighbour = which === 'start' ? points[1] : points[points.length - 2]
  const point = points[index]
  const handle = which === 'start' ? point.out : point.in
  const towards = handle
    ? { x: point.x + handle.x, y: point.y + handle.y }
    : which === 'start'
      ? neighbour.in
        ? { x: neighbour.x + neighbour.in.x, y: neighbour.y + neighbour.in.y }
        : neighbour
      : neighbour.out
        ? { x: neighbour.x + neighbour.out.x, y: neighbour.y + neighbour.out.y }
        : neighbour
  const dx = point.x - towards.x
  const dy = point.y - towards.y
  const length = Math.hypot(dx, dy)
  if (!length) return null
  return { x: dx / length, y: dy / length }
}

/**
 * How far the line stops short of its endpoint for each kind of head, so the
 * stroke — and its dashes — end where the head begins rather than running on
 * through it. An open arrow is two strokes meeting at the tip, so the line runs
 * all the way to meet them.
 */
function setback(kind: TLineEnd, strokeWidth: number): number {
  const { length, halfWidth } = headSize(strokeWidth)
  if (kind === 'triangle') return length
  if (kind === 'circle') return halfWidth
  if (kind === 'bar') return strokeWidth / 2
  return 0
}

/**
 * The path with its ends drawn back to make room for the heads, and where the
 * heads go.
 *
 * The end point is moved back along the line's own direction and its control
 * handle, if it has one, goes with it, so a curve bends very slightly
 * differently over its last few pixels and a straight line is simply shorter.
 * A line too short for both setbacks keeps a little length in the middle rather
 * than turning inside out.
 */
export function lineWithEnds(
  points: TPathPoint[],
  closed: boolean,
  box: TPaintBox,
  strokeWidth: number,
  ends: TLineEnds,
): { d: string; heads: TLineHead[] } {
  const placed = absolutePoints(points, { left: box.x, top: box.y, width: box.width, height: box.height })
  const unit = { x: 0, y: 0, width: 1, height: 1 }
  if (closed || placed.length < 2 || (!ends.start && !ends.end)) {
    return { d: pathD(placed, closed, unit), heads: [] }
  }

  const heads: TLineHead[] = []
  const trimmed = placed.map((point) => ({ ...point }))
  const first = trimmed[0]
  const last = trimmed[trimmed.length - 1]
  const startDir = ends.start ? outwardAt(placed, 'start') : null
  const endDir = ends.end ? outwardAt(placed, 'end') : null

  // Only a straight two-point line can be shortened from both ends into
  // nothing, so that is the one case the setbacks are shared out over.
  const span = Math.hypot(last.x - first.x, last.y - first.y)
  let startBack = ends.start && startDir ? setback(ends.start, strokeWidth) : 0
  let endBack = ends.end && endDir ? setback(ends.end, strokeWidth) : 0
  if (placed.length === 2 && startBack + endBack > span * 0.8) {
    const scale = (span * 0.8) / (startBack + endBack || 1)
    startBack *= scale
    endBack *= scale
  }

  if (ends.start && startDir) {
    heads.push({ kind: ends.start, x: first.x, y: first.y, angle: Math.atan2(startDir.y, startDir.x) })
    first.x -= startDir.x * startBack
    first.y -= startDir.y * startBack
  }
  if (ends.end && endDir) {
    heads.push({ kind: ends.end, x: last.x, y: last.y, angle: Math.atan2(endDir.y, endDir.x) })
    last.x -= endDir.x * endBack
    last.y -= endDir.y * endBack
  }

  return { d: pathD(trimmed, false, unit), heads }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

/** The `d` of a head that is drawn as a path: the open arrow and the filled triangle. */
export function headPath(head: TLineHead, strokeWidth: number): string {
  const { length, halfWidth } = headSize(strokeWidth)
  const cos = Math.cos(head.angle)
  const sin = Math.sin(head.angle)
  // Back along the line by the head's length, then out to either side.
  const base = { x: head.x - cos * length, y: head.y - sin * length }
  const left = { x: base.x - sin * halfWidth, y: base.y + cos * halfWidth }
  const right = { x: base.x + sin * halfWidth, y: base.y - cos * halfWidth }
  const d = `M ${round(left.x)} ${round(left.y)} L ${round(head.x)} ${round(head.y)} L ${round(right.x)} ${round(right.y)}`
  return head.kind === 'triangle' ? `${d} Z` : d
}

/** The two ends of a bar laid across the line at its end. */
export function barLine(head: TLineHead, strokeWidth: number) {
  const { halfWidth } = headSize(strokeWidth)
  const cos = Math.cos(head.angle)
  const sin = Math.sin(head.angle)
  return {
    x1: round(head.x - sin * halfWidth),
    y1: round(head.y + cos * halfWidth),
    x2: round(head.x + sin * halfWidth),
    y2: round(head.y - cos * halfWidth),
  }
}
