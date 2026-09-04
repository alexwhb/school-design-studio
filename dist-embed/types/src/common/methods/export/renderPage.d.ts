import type { TdLayout, TdWidgetData } from '../../../store/types';
export type PageRenderer = {
    /** `scale` multiplies the output resolution; 1 is the design's true pixel size. */
    renderPage: (pageIndex: number, scale?: number) => Promise<string | null>;
    renderWidget: (pageIndex: number, widget: TdWidgetData, scale?: number) => Promise<string | null>;
    /**
     * Draws a page that is not part of the design — a filled copy made for bulk
     * documents — without it ever entering `dLayouts`, so nothing is added to the
     * design, the autosave and the undo stack see no change, and the page strip
     * does not fill with copies.
     */
    renderLayout: (layout: TdLayout, scale?: number) => Promise<string | null>;
};
/**
 * Runs `work` with a renderer that can draw any page of the design, then puts
 * the editor back exactly as it was — same page, same selection, same zoom.
 */
export declare function withPageRenderer<T>(work: (renderer: PageRenderer) => Promise<T>): Promise<T>;
