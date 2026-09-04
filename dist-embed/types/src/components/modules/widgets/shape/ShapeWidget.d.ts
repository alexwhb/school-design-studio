/**
 * The frame a drawn shape sits in, on the canvas and off it.
 *
 * Everything the drawn shapes have in common is here: where the shape is, how
 * big, how see-through, which way up, and the size it reports back to the
 * selection box. What goes inside the frame is handed in — a corner radius for
 * the shapes CSS can round into, or a drawing of its own for a polygon or a
 * path, which it cannot. Anything belonging to one shape alone, such as the rectangle's
 * corner grips or a path's points, comes in as a child.
 */
import { type ReactNode } from 'react';
import type { WidgetProps } from '../types';
import './shape.less';
/**
 * How the shape is drawn, and only ever one of the two: a corner radius for
 * `ShapePaint` to round a box into, or a drawing that paints itself.
 */
type ShapeFill = {
    radius: string;
    paint?: never;
} | {
    paint: ReactNode;
    radius?: never;
};
/** The widget's own class, `w-rect`, `w-ellipse`, `w-polygon` or `w-path`. */
type Props = WidgetProps & ShapeFill & {
    kind: string;
};
export declare function ShapeWidget({ params, parent, id, className, kind, radius, paint, child, children, ...rest }: Props): import("react").JSX.Element;
/**
 * The same shape with nothing that answers the mouse, for page thumbnails,
 * slides and exports. It reads its widget straight rather than through a
 * snapshot, because nothing here is going to change under it.
 */
export declare function ShapeStatic({ params, parent, className, radius, paint, child, children, ...rest }: WidgetProps & ShapeFill): import("react").JSX.Element;
export {};
