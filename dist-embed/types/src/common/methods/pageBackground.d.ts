/**
 * A page background fills the page, so a picture whose shape is not the page's
 * shape gets cropped. `backgroundTransform` is what the user chooses about that
 * crop: which part of the picture stays visible, and how far it is zoomed past
 * the size that just covers the page.
 */
import type { CSSProperties } from 'react';
import type { TPageState } from '../../store/types';
export type TBackgroundTransform = {
    /** Horizontal focal point: 0 shows the picture's left edge, 100 its right. */
    x?: number;
    /** Vertical focal point: 0 shows the top edge, 100 the bottom. */
    y?: number;
    /** Zoom over the size that just covers the page, so 1 is that size. */
    scale?: number;
    /**
     * The picture's own width / height, recorded when the background is set.
     * Only a zoom needs it, and only because CSS cannot express "cover, times
     * 1.4": the size has to be given on whichever axis overflows, and which axis
     * that is depends on the picture's shape.
     */
    ratio?: number;
};
export declare const DEFAULT_FOCUS = 50;
export declare const MIN_SCALE = 1;
export declare const MAX_SCALE = 3;
/** The transform with every gap filled in, for a control that has to show a value. */
export declare function backgroundTransformOf(page: Pick<TPageState, 'backgroundTransform'>): {
    x: number;
    y: number;
    scale: number;
    ratio: number | undefined;
};
/**
 * The `background-*` half of a page's style, shared by every surface that draws
 * a page — the editor canvas, the page thumbnails, the presentation view — so
 * that a background positioned in one is positioned the same in all of them.
 *
 * A percentage `background-position` is measured against the part that overflows
 * rather than the box, which is exactly the pan the user wants: 0 to 100 walks
 * the visible window across the cropped picture, and needs to know nothing about
 * the picture's size.
 */
export declare function pageBackgroundStyle(page: TPageState): CSSProperties;
