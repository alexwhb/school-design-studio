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
import { type TPaintBox, type TPathPoint } from './pathGeometry';
export type TLineEnd = 'arrow' | 'triangle' | 'circle' | 'bar';
/** In the order the panel lists them, with what it calls each. */
export declare const LINE_ENDS: {
    value: TLineEnd;
    label: string;
}[];
export type TLineEnds = {
    start: TLineEnd | null;
    end: TLineEnd | null;
};
/** The ends a widget asks for. Absent, unknown, or on a closed path all read as none. */
export declare function readLineEnds(params: Record<string, any> | null | undefined): TLineEnds;
export declare function hasLineEnds(params: Record<string, any> | null | undefined): boolean;
/**
 * How big a head is for a stroke this thick, in design pixels: four strokes
 * long and as wide, with a floor so a hairline still gets a head you can see.
 */
export declare function headSize(strokeWidth: number): {
    length: number;
    halfWidth: number;
};
/**
 * The room a path's frame keeps round the curve for its heads, beyond the half
 * stroke it keeps anyway. Zero for a path with no ends, which is every path
 * drawn before ends existed.
 */
export declare function endsPad(params: Record<string, any> | null | undefined): number;
export type TLineHead = {
    kind: TLineEnd;
    /** Where the line ends, in the widget's own pixels. */
    x: number;
    y: number;
    /** Which way the head points, in radians, outward along the line. */
    angle: number;
};
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
export declare function lineWithEnds(points: TPathPoint[], closed: boolean, box: TPaintBox, strokeWidth: number, ends: TLineEnds): {
    d: string;
    heads: TLineHead[];
};
/** The `d` of a head that is drawn as a path: the open arrow and the filled triangle. */
export declare function headPath(head: TLineHead, strokeWidth: number): string;
/** The two ends of a bar laid across the line at its end. */
export declare function barLine(head: TLineHead, strokeWidth: number): {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
};
