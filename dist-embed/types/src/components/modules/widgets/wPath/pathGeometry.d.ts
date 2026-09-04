export type TPathHandle = {
    x: number;
    y: number;
};
export type TPathPoint = {
    /** 0 at the painted box's left edge, 1 at its right. Likewise y, top to bottom. */
    x: number;
    y: number;
    /** The control handle running back towards the previous point, as an offset. */
    in?: TPathHandle;
    /** The control handle running on towards the next point. */
    out?: TPathHandle;
};
export type TBox = {
    left: number;
    top: number;
    width: number;
    height: number;
};
/** The rectangle a path's geometry is laid into, in the widget's own pixels. */
export type TPaintBox = {
    x: number;
    y: number;
    width: number;
    height: number;
};
/**
 * The smallest frame a path is given on either axis. A straight horizontal line
 * has no height at all, and a widget with none cannot be selected, resized or
 * divided into to work out where its points sit.
 */
export declare const PATH_MIN_FRAME = 4;
/**
 * The points a widget actually draws, with anything malformed left out.
 *
 * Read by the canvas, the read-only twin, the grips and the panel, so a design
 * hand-edited or brought in from elsewhere fails to draw a point rather than
 * failing to draw at all.
 */
export declare function readPoints(params: Record<string, any> | null | undefined): TPathPoint[];
/** True when the last point runs back to the first. Absent reads as open. */
export declare function isClosed(params: Record<string, any> | null | undefined): boolean;
/** A copy nothing else holds a reference into, ready to be written to the store. */
export declare function clonePoints(points: TPathPoint[]): TPathPoint[];
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
export declare function paintBox(width: number, height: number, strokeWidth?: number, pad?: number): TPaintBox;
/** The same rectangle, placed on the page rather than inside the widget. */
export declare function innerBox(box: TBox, strokeWidth?: number, pad?: number): TBox;
/**
 * The `d` a path of this shape draws at this size.
 *
 * A stretch with no handle at either end is a straight line and is written as
 * one, so a path of corners reads as the polyline it is. `Z` is only ever added
 * for a closed path: an open one is still filled — SVG closes it off with a
 * straight run for the fill and leaves the outline open, which is what Adobe XD
 * shows too.
 */
export declare function pathD(points: TPathPoint[], closed: boolean, box: TPaintBox): string;
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
export declare function curveBounds(points: TPathPoint[], closed: boolean): {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
};
/** Points measured in design pixels rather than in fractions of a frame. */
export declare function absolutePoints(points: TPathPoint[], box: TBox): TPathPoint[];
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
export declare function fitFrame(points: TPathPoint[], closed: boolean, pad?: number): {
    box: TBox;
    points: TPathPoint[];
};
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
export declare function refitFrame(points: TPathPoint[], closed: boolean, box: TBox, strokeWidth?: number, pad?: number): {
    box: TBox;
    points: TPathPoint[];
} | null;
/**
 * The handles that make a point smooth: a pair pointing along the line between
 * its neighbours, a third of the way to each.
 *
 * A third is the length that makes three evenly spaced points come out as an
 * arc rather than a bulge, and it is what every drawing program reaches for
 * when it is asked to smooth a corner.
 */
export declare function smoothHandles(points: TPathPoint[], index: number, closed: boolean): {
    in?: TPathHandle;
    out?: TPathHandle;
};
