import type { PageContent } from './pageContent';
import type { TdLayout } from '../../../store/types';
/**
 * How many design pixels make an inch of paper.
 *
 * The editor stores a page in pixels and nothing records how big it is meant to
 * be in the world, so the number has to come from somewhere. 150 is the
 * convention the page presets are already built on — "Letter — portrait" is
 * 1275 × 1650, which is 8.5 × 11 inches at 150 — so reading them back at 150
 * returns exactly the paper size the person picked. Read at the CSS-pixel 96
 * instead, that same Letter page would come out as a 13 × 17 inch sheet.
 *
 * It lives in `dpi.ts` and is re-exported here, so that code with no browser
 * behind it can read the number without loading this file's canvas work.
 */
export { DESIGN_DPI, pxToPdfPoints } from './dpi';
/** Multiplier applied to the render. 1 gives 150 DPI, 2 gives 300, 3 gives 450. */
export type ExportScale = 1 | 2 | 3;
export type RasterPage = {
    jpeg: Uint8Array;
    pixelWidth: number;
    pixelHeight: number;
    widthPt: number;
    heightPt: number;
    content: PageContent | null;
};
export type PdfOptions = {
    title: string;
    scale: ExportScale;
    renderPage: (pageIndex: number, scale: number) => Promise<string | null>;
    /**
     * The readable structure of a page: its text, in reading order, with the
     * headings named and the pictures described. Without it the export still
     * works and produces what it always did, a picture per page, but tagged, with
     * a title and a language.
     */
    contentFor?: (pageIndex: number) => Promise<PageContent | null> | PageContent | null;
    /** BCP 47 tag for the document's language. Anything that is not one is ignored. */
    language?: string;
    onProgress?: (percent: number, message: string) => void;
};
/** A language tag, or the default. Anything unexpected is not worth passing on. */
export declare function safeLanguage(input?: string): string;
/**
 * Assembles the file.
 *
 * Two passes, because the parts refer to each other in both directions. The
 * first walks the pages building content streams, which is where the tagged
 * items get their marked-content ids and where the text layer finds out which
 * characters the document contains. Only then is it known how many fonts the
 * file needs, so the second pass writes everything out with every reference
 * resolved.
 */
export declare function assemblePdf(pages: RasterPage[], title: string, language: string): Blob;
/**
 * The file itself, as a Blob.
 *
 * Split from the download so that a host embedding the editor can take the
 * bytes and do something else with them — attach the PDF to a task, put it in
 * its own object store — without a file landing in the user's Downloads folder
 * on the way past. The download below is this plus one line, so there is no
 * second way of building a PDF to keep in step.
 */
export declare function buildPdf(pages: TdLayout[], options: PdfOptions): Promise<Blob>;
export default function exportPdf(pages: TdLayout[], options: PdfOptions): Promise<void>;
