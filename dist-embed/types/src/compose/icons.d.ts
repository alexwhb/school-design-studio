import type { TdWidgetData } from '../store/types';
/** Every icon name a sign may ask for, in the library's own order. */
export declare const ICON_KEYS: string[];
export declare function hasIcon(key: string | null | undefined): boolean;
export declare function iconWidget(key: string, left: number, top: number, size: number, color: string): TdWidgetData | null;
