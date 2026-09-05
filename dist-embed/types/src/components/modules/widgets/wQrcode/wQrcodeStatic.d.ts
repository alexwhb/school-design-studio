import type { WidgetProps } from '../types';
/**
 * Read-only twin of wQrcode.
 *
 * The editing component reports its measured size back to the store and pokes
 * moveable on every update, which is exactly what a page thumbnail or a slide
 * must not do. This renders the same QR code and nothing else.
 */
declare function WQrcodeStatic({ params, parent, className, ...rest }: WidgetProps): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof WQrcodeStatic>;
export default _default;
