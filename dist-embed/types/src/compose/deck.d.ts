/**
 * A slide deck from an outline.
 *
 * The outline is what a model is good at — a layout name, a heading, some
 * bullets, a note to say out loud — and the layout is what it is bad at. So
 * nothing about position, size or colour comes from the caller. Each of the
 * five layouts is drawn here against the theme's own numbers, and the words are
 * measured into the boxes rather than poured into them: a heading two words
 * longer than the designer's comes down a point at a time until it fits.
 *
 * Bullets that run past the bottom of a slide go onto another one after it,
 * the same layout under the same heading with "(continued)" on the end. They
 * used to be dropped, on the theory that nobody reads the seventh bullet. But a
 * model that wrote eight points with two sub-points each got four of them and
 * half the sub-points, with nothing to say so, and the four that went missing
 * were the ones somebody had asked for. A second slide is a thing a person can
 * see and fix; a missing point is not. What still cannot be placed — a slide
 * past the page limit, a heading cut short to fit — is written down in the
 * report `composeDeckWithReport` hands back. See `report.ts`.
 */
import type { ComposeOptions, ComposeResult, DeckOutline, DeckSlide, DesignDocument } from './types';
import type { Theme } from './themes';
import { type Recorder } from './report';
import type { TdLayout } from '../store/types';
/** The layout names `addPage` will take for a deck. */
export declare const DECK_PAGE_KINDS: DeckSlide['layout'][];
export declare function blankSlide(layout: DeckSlide['layout']): DeckSlide;
/** Fills a `{{school.*}}` line before it is measured. See `fieldFiller`. */
type Fill = (text: string) => string;
/**
 * One slide as however many pages it needs, up to `room`. What would have
 * needed more is written down as `page-limit` against the page it would have
 * started. Shared by the deck and by `addPage`, so a slide an AI refine adds
 * behaves exactly like one in a composed deck.
 */
export declare function composeSlidePages(slide: DeckSlide, theme: Theme, fill: Fill, rec: Recorder, firstPage: number, room: number): TdLayout[];
/** One slide, as a page of the design. Exported so `addPage` can make one. */
export declare function composeSlide(slide: DeckSlide, theme: Theme, fill?: Fill): TdLayout;
/**
 * A deck, and what had to give to make it.
 *
 * The slides the outline asked for come first: a continuation page is only
 * made while there is room for every slide still to come, so a long list on
 * slide two never pushes slide forty off the end. Past `maxPages`, whole
 * slides are left out and reported, never half of one.
 */
export declare function composeDeckWithReport(outline: DeckOutline, options?: ComposeOptions): ComposeResult;
export declare function composeDeck(outline: DeckOutline, options?: ComposeOptions): DesignDocument;
export {};
