import type { WidgetProps } from '../types';
/**
 * Read-only twin of wTable, for page thumbnails, slides and exports: the same
 * grid with nothing that answers the mouse and nothing that writes back.
 */
declare function WTableStatic({ params, parent, className, child, children, ...rest }: WidgetProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof WTableStatic>;
export default _default;
