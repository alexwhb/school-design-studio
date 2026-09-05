/**
 * What a widget fills and strokes with, for one that draws its shape in React
 * rather than by parsing markup into the DOM.
 *
 * The colour picker hands back CSS — `linear-gradient(45deg, …)` — which an SVG
 * `fill` cannot hold: SVG paints a gradient by referring to a server defined
 * elsewhere in the document. `svgGradientSpec` works out where that server's
 * ends go for a given box, and is shared with the DOM builder the parsed-markup
 * shapes use, so a gradient laid across a drawn polygon and one laid across a
 * library shape run the same way.
 *
 * `usePaint` gives back both halves: what to put in the attribute, and the
 * server it may need alongside. A flat colour needs no server and goes straight
 * through.
 */
import { type ReactNode } from 'react';
import { type PaintBox } from '../../../utils/svgPaint';
/**
 * An id nothing else in the document will be holding.
 *
 * They have to be unique across the whole page, not just within one shape: the
 * same widget is on screen twice whenever the page strip is open, once on the
 * canvas and once in its thumbnail, and `url(#id)` finds whichever came first.
 * React's own per-instance id keeps the two apart. Its colons are legal in a
 * fragment but not in a CSS identifier, so they come out.
 */
export declare function useGradientId(suffix: string): string;
/**
 * @returns `paint` for a `fill` or a `stroke`, and `defs` to render inside
 * `<defs>` — null for a flat colour, which is already a valid paint on its own.
 */
export declare function usePaint(value: string, box: PaintBox, suffix: string): {
    paint: string;
    defs: ReactNode;
};
