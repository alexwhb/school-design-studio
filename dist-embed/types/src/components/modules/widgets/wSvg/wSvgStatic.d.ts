import type { WidgetProps } from '../types';
/**
 * Read-only twin of wSvg.
 *
 * Shapes are stored as SVG markup rather than a URL, and their colours as
 * `{{colors[n]}}` placeholders, so drawing one means parsing the markup and
 * painting it. That goes through the same `shapePaint` the canvas uses — or a
 * shape shows up as an empty box in the page thumbnails and in presentation
 * mode, and a gradient that is on the canvas is missing from every export.
 */
declare function WSvgStatic({ params, parent, className, ...rest }: WidgetProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof WSvgStatic>;
export default _default;
