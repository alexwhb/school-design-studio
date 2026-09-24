/**
 * A drawn shape's frame with nothing that answers the mouse. Its own file, so
 * that the read-only views — page thumbnails, slides, the viewer — draw shapes
 * without loading the editor's store along with the editing frame.
 */
import { type ReactNode } from 'react';
import type { WidgetProps } from '../types';
import './shape.less';
/**
 * How the shape is drawn, and only ever one of the two: a corner radius for
 * `ShapePaint` to round a box into, or a drawing that paints itself.
 */
export type ShapeFill = {
    radius: string;
    paint?: never;
} | {
    paint: ReactNode;
    radius?: never;
};
/**
 * The same shape with nothing that answers the mouse, for page thumbnails,
 * slides and exports. It reads its widget straight rather than through a
 * snapshot, because nothing here is going to change under it.
 */
export declare function ShapeStatic({ params, parent, className, radius, paint, child, children, ...rest }: WidgetProps & ShapeFill): import("react").JSX.Element;
