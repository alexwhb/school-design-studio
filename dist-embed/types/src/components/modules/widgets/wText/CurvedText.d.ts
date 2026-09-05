/**
 * Draws one arc's worth of characters, as worked out by arcLayout.ts.
 *
 * The canvas widget, the static copy the page strip and the embed render, and
 * every layer of a text effect all draw the same arc, so they all draw it
 * through this.
 */
import { type CSSProperties } from 'react';
import type { TCurvedLayout } from './arcLayout';
type Props = {
    layout: TCurvedLayout;
    className?: string;
    style?: CSSProperties;
    /**
     * Draw every character in the layer's own colour. An effect layer is painted
     * in the colour of its fill or made transparent for its outline, and a word
     * coloured by hand must not punch through that — the straight-text layers
     * get the same treatment from a stylesheet rule.
     */
    plain?: boolean;
};
declare function CurvedText({ layout, className, style, plain }: Props): import("react").JSX.Element;
declare const _default: import("react").MemoExoticComponent<typeof CurvedText>;
export default _default;
