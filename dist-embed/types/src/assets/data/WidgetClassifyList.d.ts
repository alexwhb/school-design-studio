import type { ComponentType, CSSProperties } from 'react';
/**
 * The tab a host's own panel is shown behind. Not in the list below: it only
 * exists when the `assistant` prop does, and WidgetPanel puts it in front.
 */
export declare const ASSISTANT_PANEL = "assistant-wrap";
export type TWidgetClassifyData = {
    name: string;
    /** A glyph from the icon font, or '' when `Icon` draws the tab instead. */
    icon: string;
    /** An SVG icon, for a tab the icon font has no glyph for. */
    Icon?: ComponentType<{
        className?: string;
    }>;
    show: boolean;
    component: string;
    style?: CSSProperties;
};
declare const _default: TWidgetClassifyData[];
export default _default;
