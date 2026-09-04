import type { TdLayout, TdWidgetData } from '../../../store/types';
export type PptxMode = 'editable' | 'picture';
export type PptxOptions = {
    title: string;
    mode: PptxMode;
    /** Called with 0-100 so the caller can drive a progress bar. */
    onProgress?: (percent: number, message: string) => void;
    /** Renders one page to a PNG data URL. Required for 'picture' mode. */
    renderPage?: (pageIndex: number) => Promise<string | null>;
    /** Renders a single element to a PNG data URL, used for the fallbacks. */
    renderWidget?: (pageIndex: number, widget: TdWidgetData) => Promise<string | null>;
};
/**
 * The deck itself, as a Blob.
 *
 * Split from the download for the same reason the PDF is: a host that embeds
 * the editor wants the bytes to POST somewhere, not a file in the user's
 * Downloads folder. pptxgenjs will hand back either, so the two paths differ
 * only in what they ask it for.
 */
export declare function buildPptx(layouts: TdLayout[], options: PptxOptions): Promise<Blob>;
export declare function exportPptx(layouts: TdLayout[], options: PptxOptions): Promise<void>;
export default exportPptx;
