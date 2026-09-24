import type { WidgetProps } from '../types';
import './shape.less';
import type { ShapeFill } from './ShapeStatic';
/** The widget's own class, `w-rect`, `w-ellipse`, `w-polygon` or `w-path`. */
type Props = WidgetProps & ShapeFill & {
    kind: string;
};
export declare function ShapeWidget({ params, parent, id, className, kind, radius, paint, child, children, ...rest }: Props): import("react").JSX.Element;
export {};
