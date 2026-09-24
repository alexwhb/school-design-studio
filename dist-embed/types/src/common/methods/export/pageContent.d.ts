/**
 * A page as a document rather than a picture.
 *
 * This is the bridge between the two halves of the accessible export: what the
 * design means (from common/methods/accessibility) and where it sits on the
 * sheet (measured off the live page). The PDF writer takes it and needs to make
 * no judgements of its own.
 *
 * Geometry is finished by the time it leaves here — every line already carries
 * the place its baseline starts and the direction it runs in, with the widget's
 * rotation folded in — so the exporter's only remaining job is design pixels to
 * points and the flip from a screen's downward y to a page's upward one.
 */
import { type Box, type StructureTag } from '../accessibility/structure';
import type { MeasuredText } from './measureText';
import type { TdWidgetData } from '../../../store/types';
/** One stretch of text placed on the page: a word, or a whole line of one. */
export type ContentRun = {
    text: string;
    /** Where the baseline starts, in page coordinates: design pixels, y down. */
    x: number;
    y: number;
    /** How far the run goes along its baseline, in design pixels. */
    length: number;
    /** Em size, in design pixels. */
    size: number;
    /** Which way the baseline runs: degrees clockwise from left-to-right. */
    angle: number;
};
export type ContentText = {
    kind: 'text';
    uuid: string;
    tag: StructureTag;
    runs: ContentRun[];
};
export type ContentFigure = {
    kind: 'figure';
    uuid: string;
    alt: string;
    /** Where to put the tag, as an upright box around the element. */
    box: Box;
};
export type PageContent = {
    items: (ContentText | ContentFigure)[];
};
/**
 * Text a screen reader should be given for a picture nobody described.
 *
 * The alternative is leaving the picture out of the structure altogether, which
 * is what the export did before any of this existed: silence, and no way for
 * the person listening to know there was anything there. Saying that a picture
 * is present and undescribed is worse than a good description and better than
 * pretending it is not there — and the check in the editor exists so it should
 * never get this far.
 */
export declare const UNDESCRIBED = "Image with no description";
/**
 * Builds the readable form of one page.
 *
 * Order is reading order, not stacking order, because that is the order it will
 * be read aloud in. Decorative elements are left out entirely: they become part
 * of the page's picture, which the exporter marks as an artifact, and a reader
 * skips the lot.
 */
export declare function buildPageContent(layers: readonly TdWidgetData[], measured?: Map<string, MeasuredText>): PageContent;
