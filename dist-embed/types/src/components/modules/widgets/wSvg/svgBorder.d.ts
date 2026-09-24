import { type TWidgetBorder } from '../widgetBorder';
/**
 * Applies `border` to `svg`, replacing whatever the last call left behind.
 *
 * Called again for every step of the thickness slider, so undoing the previous
 * pass first is what keeps a dragged slider from stacking clip paths up in the
 * markup.
 */
export default function applySvgBorder(svg: SVGSVGElement, border: TWidgetBorder | null): void;
