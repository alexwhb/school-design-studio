/**
 * The shape of a path drawn with the pen, and the arithmetic every part of it
 * shares.
 *
 * A point is held as a fraction of the box the path is painted in rather than
 * as a design pixel: 0 is that box's left edge, 1 its right, and a control
 * handle is an offset in the same units. That is what makes a path behave like
 * every other widget under a resize handle — the box changes, the fractions do
 * not, and the curve stretches with it without anything having to recompute it.
 * It also means an outline stays the thickness it was asked for while the shape
 * it outlines is stretched, which a stroke measured in the path's own
 * coordinates would not.
 *
 * A handle is absent rather than zero when there is none, so a corner point
 * costs two keys and a design full of straight lines saves as one.
 *
 * That painted box is not the widget's frame: a stroke straddles the line it
 * follows, so the frame is the curve's own bounds with half an outline's
 * thickness of room left round it, and `paintBox` takes that half back off
 * again. An outline therefore lies wholly inside the widget the way every other
 * outline in the editor does, and a line is drawn where it was pulled rather
 * than half a thickness inside it.
 */
import { SHAPE_MIN_SIZE } from '../shape/shapeSetting'

export type TPathHandle = { x: number; y: number }

export type TPathPoint = {
  /** 0 at the painted box's left edge, 1 at its right. Likewise y, top to bottom. */
  x: number
  y: number
  /** The control handle running back towards the previous point, as an offset. */
  in?: TPathHandle
  /** The control handle running on towards the next point. */
  out?: TPathHandle
}

export type TBox = { left: number; top: number; width: number; height: number }

/** The rectangle a path's geometry is laid into, in the widget's own pixels. */
export type TPaintBox = { x: number; y: number; width: number; height: number }

/**
 * The smallest frame a path is given on either axis. A straight horizontal line
 * has no height at all, and a widget with none cannot be selected, resized or
 * divided into to work out where its points sit.
 */
export const PATH_MIN_FRAME = SHAPE_MIN_SIZE

function handle(value: any): TPathHandle | undefined {
  if (!value || typeof value !== 'object') return undefined
  const x = Number(value.x)
  const y = Number(value.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return undefined
  // A handle of no length is a corner written the long way round; dropping it
  // here means everything downstream can test for the key alone.
  if (x === 0 && y === 0) return undefined
  return { x, y }
}

/**
 * The points a widget actually draws, with anything malformed left out.
 *
 * Read by the canvas, the read-only twin, the grips and the panel, so a design
 * hand-edited or brought in from elsewhere fails to draw a point rather than
 * failing to draw at all.
 */
export function readPoints(params: Record<string, any> | null | undefined): TPathPoint[] {
  const held = params?.points
  if (!Array.isArray(held)) return []
  const points: TPathPoint[] = []
  for (const item of held) {
    const x = Number(item?.x)
    const y = Number(item?.y)
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    const point: TPathPoint = { x, y }
    const back = handle(item.in)
    const on = handle(item.out)
    if (back) point.in = back
    if (on) point.out = on
    points.push(point)
  }
  return points
}

/** True when the last point runs back to the first. Absent reads as open. */
export function isClosed(params: Record<string, any> | null | undefined): boolean {
  return !!params?.closed
}

/** A copy nothing else holds a reference into, ready to be written to the store. */
export function clonePoints(points: TPathPoint[]): TPathPoint[] {
  return points.map((point) => {
    const copy: TPathPoint = { x: point.x, y: point.y }
    if (point.in) copy.in = { ...point.in }
    if (point.out) copy.out = { ...point.out }
    return copy
  })
}

/**
 * The rectangle the points are fractions of: the frame, less half the outline's
 * thickness on every side, which is the room the stroke needs to lie inside the
 * widget's own edge — and less `pad`, which is any further room the widget has
 * asked for, such as a line keeps for its arrowheads (see lineEnds.ts).
 *
 * Everything measures against this and not against the frame — the curve, the
 * grips, and the frame that is fitted round a path when it is first drawn — so
 * that a point at 0 is on the outline's outer edge whatever the outline is.
 */
export function paintBox(width: number, height: number, strokeWidth = 0, pad = 0): TPaintBox {
  const inset = Math.min(strokeWidth / 2 + pad, width / 2, height / 2)
  return { x: inset, y: inset, width: Math.max(width - inset * 2, 0), height: Math.max(height - inset * 2, 0) }
}

/** The same rectangle, placed on the page rather than inside the widget. */
export function innerBox(box: TBox, strokeWidth = 0, pad = 0): TBox {
  const inner = paintBox(box.width, box.height, strokeWidth, pad)
  return { left: box.left + inner.x, top: box.top + inner.y, width: inner.width, height: inner.height }
}

/** One point mapped out of fractions and into the box it is drawn in. */
function place(point: TPathPoint, box: TPaintBox) {
  return { x: box.x + point.x * box.width, y: box.y + point.y * box.height }
}

function offset(value: TPathHandle | undefined, box: TPaintBox) {
  return value ? { x: value.x * box.width, y: value.y * box.height } : null
}

/** Each stretch of curve between two points, in the order they are drawn. */
function segments(points: TPathPoint[], closed: boolean): [TPathPoint, TPathPoint][] {
  const pairs: [TPathPoint, TPathPoint][] = []
  for (let i = 0; i < points.length - 1; i++) pairs.push([points[i], points[i + 1]])
  if (closed && points.length > 2) pairs.push([points[points.length - 1], points[0]])
  return pairs
}

/**
 * The `d` a path of this shape draws at this size.
 *
 * A stretch with no handle at either end is a straight line and is written as
 * one, so a path of corners reads as the polyline it is. `Z` is only ever added
 * for a closed path: an open one is still filled — SVG closes it off with a
 * straight run for the fill and leaves the outline open, which is what Adobe XD
 * shows too.
 */
export function pathD(points: TPathPoint[], closed: boolean, box: TPaintBox): string {
  if (points.length < 2) return ''
  const start = place(points[0], box)
  let d = `M ${round(start.x)} ${round(start.y)}`
  for (const [from, to] of segments(points, closed)) {
    const a = place(from, box)
    const b = place(to, box)
    const out = offset(from.out, box)
    const back = offset(to.in, box)
    if (!out && !back) {
      d += ` L ${round(b.x)} ${round(b.y)}`
      continue
    }
    const c1 = { x: a.x + (out?.x ?? 0), y: a.y + (out?.y ?? 0) }
    const c2 = { x: b.x + (back?.x ?? 0), y: b.y + (back?.y ?? 0) }
    d += ` C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(b.x)} ${round(b.y)}`
  }
  if (closed && points.length > 2) d += ' Z'
  return d
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

/**
 * Where a cubic turns back on itself, which is where it may reach past both of
 * its ends. Its derivative is a quadratic; these are that quadratic's roots
 * inside the stretch of curve that is actually drawn.
 */
function turningPoints(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3
  const b = 2 * (p0 - 2 * p1 + p2)
  const c = p1 - p0
  const roots: number[] = []
  if (Math.abs(a) < 1e-9) {
    if (Math.abs(b) > 1e-9) roots.push(-c / b)
  } else {
    const discriminant = b * b - 4 * a * c
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant)
      roots.push((-b + root) / (2 * a), (-b - root) / (2 * a))
    }
  }
  return roots.filter((t) => t > 0 && t < 1)
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number) {
  const u = 1 - t
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3
}

/**
 * The rectangle a path actually covers, in whatever units its points are given
 * in.
 *
 * The curve rather than the points: a control handle nearly always lies outside
 * the shape it bends, so a frame taken from the handles would be loose on every
 * curved side, and a frame taken from the anchors alone would cut the bulge of
 * the curve off. Both matter, because the frame is what a resize handle, an
 * alignment and a snap all read.
 */
export function curveBounds(points: TPathPoint[], closed: boolean) {
  const xs: number[] = []
  const ys: number[] = []
  for (const point of points) {
    xs.push(point.x)
    ys.push(point.y)
  }
  for (const [from, to] of segments(points, closed)) {
    if (!from.out && !to.in) continue
    const c1 = { x: from.x + (from.out?.x ?? 0), y: from.y + (from.out?.y ?? 0) }
    const c2 = { x: to.x + (to.in?.x ?? 0), y: to.y + (to.in?.y ?? 0) }
    for (const t of turningPoints(from.x, c1.x, c2.x, to.x)) xs.push(cubicAt(from.x, c1.x, c2.x, to.x, t))
    for (const t of turningPoints(from.y, c1.y, c2.y, to.y)) ys.push(cubicAt(from.y, c1.y, c2.y, to.y, t))
  }
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) }
}

/** Points measured in design pixels rather than in fractions of a frame. */
export function absolutePoints(points: TPathPoint[], box: TBox): TPathPoint[] {
  return points.map((point) => {
    const copy: TPathPoint = { x: box.left + point.x * box.width, y: box.top + point.y * box.height }
    if (point.in) copy.in = { x: point.in.x * box.width, y: point.in.y * box.height }
    if (point.out) copy.out = { x: point.out.x * box.width, y: point.out.y * box.height }
    return copy
  })
}

/**
 * Wraps a frame round points measured in design pixels, and turns them into the
 * fractions of it a widget holds.
 *
 * `pad` is half the outline's thickness, left round the curve so the stroke has
 * somewhere to sit: the frame comes back that much bigger than the curve on
 * every side, and `paintBox` takes it straight back off, so a line is drawn
 * exactly where it was pulled rather than half a thickness inside it.
 *
 * A frame with no width — every point on one vertical line — is widened to the
 * smallest a shape is allowed to be and its points pinned to the middle of it,
 * so a straight line is still something that can be selected and dragged.
 */
export function fitFrame(points: TPathPoint[], closed: boolean, pad = 0): { box: TBox; points: TPathPoint[] } {
  const bounds = curveBounds(points, closed)
  const [left, width] = span(bounds.minX, bounds.maxX)
  const [top, height] = span(bounds.minY, bounds.maxY)
  // Measured against the rounded inner box rather than against the exact bounds,
  // so that what is stored and what is drawn agree to the pixel.
  const fractions = points.map((point) => {
    const copy: TPathPoint = { x: (point.x - left) / width, y: (point.y - top) / height }
    if (point.in) copy.in = { x: point.in.x / width, y: point.in.y / height }
    if (point.out) copy.out = { x: point.out.x / width, y: point.out.y / height }
    return copy
  })
  return { box: { left: left - pad, top: top - pad, width: width + pad * 2, height: height + pad * 2 }, points: fractions }
}

/** One axis of the inner box: where it starts and how long it is, in whole pixels. */
function span(low: number, high: number): [number, number] {
  const start = Math.round(low)
  const length = Math.round(high) - start
  if (length >= PATH_MIN_FRAME) return [start, length]
  // Widened about the middle rather than from the left, or a straight vertical
  // line would be drawn a couple of pixels to the side of where it was pulled.
  return [Math.round((low + high) / 2 - PATH_MIN_FRAME / 2), PATH_MIN_FRAME]
}

/**
 * The frame put back round points that have been dragged out of it.
 *
 * A point moved past the edge of its widget is still drawn — the paint is not
 * clipped — but the frame is then no longer the shape's bounds, and everything
 * that reads it, from the selection box to snapping, is out by however far the
 * point went. So the frame is refitted once the drag ends, which is also when
 * Adobe XD's bounding box catches up with a moved point.
 *
 * @returns null when the frame already fits, which is the usual case.
 */
export function refitFrame(points: TPathPoint[], closed: boolean, box: TBox, strokeWidth = 0, pad = 0): { box: TBox; points: TPathPoint[] } | null {
  const fitted = fitFrame(absolutePoints(points, innerBox(box, strokeWidth, pad)), closed, strokeWidth / 2 + pad)
  const same =
    fitted.box.left === box.left && fitted.box.top === box.top && fitted.box.width === box.width && fitted.box.height === box.height
  return same ? null : fitted
}

/**
 * The handles that make a point smooth: a pair pointing along the line between
 * its neighbours, a third of the way to each.
 *
 * A third is the length that makes three evenly spaced points come out as an
 * arc rather than a bulge, and it is what every drawing program reaches for
 * when it is asked to smooth a corner.
 */
export function smoothHandles(points: TPathPoint[], index: number, closed: boolean): { in?: TPathHandle; out?: TPathHandle } {
  const count = points.length
  const previous = index > 0 ? points[index - 1] : closed ? points[count - 1] : null
  const next = index < count - 1 ? points[index + 1] : closed ? points[0] : null
  const from = previous ?? points[index]
  const to = next ?? points[index]
  const dx = (to.x - from.x) / 3
  const dy = (to.y - from.y) / 3
  if (dx === 0 && dy === 0) return {}
  return { in: { x: -dx, y: -dy }, out: { x: dx, y: dy } }
}
