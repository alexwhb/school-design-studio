import type { TdLayout, TPageState } from '../../../store/types';
export type DesignIssueKind = 'overflow' | 'tiny-text' | 'low-contrast' | 'missing-alt';
/** One thing to look at, on one page, on one widget. `page` is 0-based. */
export type DesignIssue = {
    page: number;
    widgetId: string;
    kind: DesignIssueKind;
    message: string;
};
export type CheckOptions = {
    /**
     * Leave out the missing-alt check. A PNG carries no alt text at all, so
     * asking for it before one is pointless.
     */
    skipAlt?: boolean;
};
/**
 * The smallest type worth putting on this page, in design pixels.
 *
 * Printed (a page the shape of a sheet of paper, drawn at 150 DPI): 12pt, which
 * is where the RNIB's Clear Print guidance, the one schools and councils are
 * held to for paper, puts its floor. 12pt at 150 DPI is 25px.
 *
 * On a screen (a slide, or anything else not paper-shaped): 20px on a page
 * 1080 high, scaled with the page. That is 10pt on PowerPoint's 7.5-inch
 * slide. Presentation guides ask for 18pt for body text, which is 36px here,
 * but the studio's own themes set bullets at 26 to 32px, and a check that
 * flags every slide stops being read. This is aimed at the text nobody in the
 * room can read at all: a caption pasted in at 14px, a footnote at 12.
 */
export declare function minimumSize(page: Pick<TPageState, 'width' | 'height'>): number;
/** Every issue in a design, page by page, in the order the page is stacked. */
export declare function checkLayouts(layouts: readonly TdLayout[], options?: CheckOptions): DesignIssue[];
