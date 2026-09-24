import { type PageContent } from './pageContent';
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
    /**
     * What the page says, as opposed to how it looks: its text in reading order,
     * its headings, and its pictures' alt text, with every line placed where the
     * browser laid it out. The PDF's text layer is built from this.
     */
    pageContent: (pageIndex: number) => Promise<PageContent>;
    /** The same for a page that is not part of the design. See `renderLayout`. */
    layoutContent: (layout: TdLayout) => Promise<PageContent>;
};
/**
 * Runs `work` with a renderer that can draw any page of the design, then puts
 * the editor back exactly as it was — same page, same selection, same zoom.
 *
 * One export at a time. Drawing a page means putting it on the canvas, and
 * there is one canvas: a download started while the host was drawing its
 * thumbnail used to move the canvas to its own pages in the middle of the
 * other's, so each file came out with some of the other's pages in it, and
 * whichever finished second put the canvas back on the page the first had
 * left it on. So each export waits for the one before it to finish, whether
 * that one worked or not, and the editor is put back only once, by each, as
 * it found it.
 */
export declare function withPageRenderer<T>(work: (renderer: PageRenderer) => Promise<T>): Promise<T>;
