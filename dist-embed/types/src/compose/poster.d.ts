/**
 * Signs and posters from an outline.
 *
 * A sign is read at a distance and in a hurry — a parent in a corridor looking
 * for the gym, a queue outside a book fair — so every one of these layouts puts
 * one thing very large and everything else out of its way. The five differ in
 * what that one thing is: a place, a picture, a sentence, a number, or a notice
 * that has to be read rather than glanced at.
 *
 * Sizes are fractions of the page rather than pixels, so the same five layouts
 * hold on Letter, on tabloid, on a banner and on any of them turned sideways.
 */
import type { ComposeOptions, ComposeResult, DesignDocument, PosterOutline, PosterSign } from './types';
import type { Theme } from './themes';
import { type Recorder } from './report';
import type { TdLayout } from '../store/types';
export declare const SIGN_PAGE_KINDS: PosterSign['layout'][];
export declare function blankSign(layout: PosterSign['layout']): PosterSign;
export declare function pageSize(outline: Pick<PosterOutline, 'orientation' | 'size'>): {
    width: number;
    height: number;
};
/** Fills a `{{school.*}}` line before it is measured. See `fieldFiller`. */
type Fill = (text: string) => string;
/** One sign as a page, with its cuts written to `rec`. Shared by the poster and `addPage`. */
export declare function composeSignPage(sign: PosterSign, theme: Theme, size: {
    width: number;
    height: number;
}, fill: Fill, rec: Recorder): TdLayout;
/** One sign, as a page. Exported so `addPage` can make one. */
export declare function composeSign(sign: PosterSign, theme: Theme, size: {
    width: number;
    height: number;
}, fill?: Fill): TdLayout;
/**
 * Signs, and what had to give to make them: each sign is one page, so a sign
 * is never continued, and what is cut is only ever the end of a line that
 * would not fit at the smallest size its layout allows. Signs past `maxPages`
 * are left out and reported.
 */
export declare function composePosterWithReport(outline: PosterOutline, options?: ComposeOptions): ComposeResult;
export declare function composePoster(outline: PosterOutline, options?: ComposeOptions): DesignDocument;
export {};
