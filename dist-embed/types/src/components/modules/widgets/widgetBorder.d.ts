/**
 * The one outline a shape or an image can be given, read off a widget.
 *
 * Shapes and photographs draw it by completely different means — one strokes
 * SVG geometry, the other lays a ring over the picture — but both take the same
 * three settings off the widget, and both have to agree on when there is
 * nothing to draw. That agreement lives here so a widget with `borderWidth: 0`
 * cannot end up outlined in one place and bare in the other.
 */
import type { CSSProperties } from 'react';
export type TWidgetBorder = {
    /** Design pixels, and always inside the element's own edge. */
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
};
/** Null when the widget asks for no outline, which is the usual case. */
export declare function widgetBorder(params: Record<string, any> | null | undefined): TWidgetBorder | null;
/**
 * The gap pattern a dashed or dotted outline is drawn with, in design pixels.
 *
 * Shared so that a dashed outline round a photograph, round a library shape and
 * round a path drawn with the pen all break into the same rhythm. A dotted one
 * is a run of zero-length dashes, which only shows up at all once the ends are
 * rounded off — every caller that asks for it rounds its caps.
 *
 * @returns null for a solid outline, which needs no pattern.
 */
export declare function dashesFor(border: TWidgetBorder): string | null;
export declare function supportsMaskRing(): boolean;
/**
 * @param radius any CSS `border-radius` value — one length, or the four a box
 * with its corners held apart needs.
 */
export declare function gradientRingStyle(width: number, color: string, radius: string): CSSProperties;
