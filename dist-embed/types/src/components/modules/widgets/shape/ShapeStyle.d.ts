/**
 * The settings panel a drawn shape gets: where it is, what it is filled with,
 * what it is outlined in, and the shadow it casts.
 *
 * Some shapes take a section of their own — the rectangle's corners, the
 * polygon's count of them, a path's points — and an ellipse takes none, so the
 * section is handed in rather than assumed. Everything else they have in
 * common, which is everything else.
 *
 * Who it is and how it lines up are drawn by the panel above this, so every
 * kind of element carries the same header rather than each one repeating it.
 */
import type { ReactNode } from 'react';
import './shapeStyle.less';
/**
 * @param shape the one section this shape has that the others do not, if any.
 * It sits between the transform and the appearance.
 */
export default function ShapeStyle({ shape }: {
    shape?: ReactNode;
}): import("react").JSX.Element | null;
