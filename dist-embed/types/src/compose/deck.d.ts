/**
 * A slide deck from an outline.
 *
 * The outline is what a model is good at — a layout name, a heading, some
 * bullets, a note to say out loud — and the layout is what it is bad at. So
 * nothing about position, size or colour comes from the caller. Each of the
 * five layouts is drawn here against the theme's own numbers, and the words are
 * measured into the boxes rather than poured into them: a heading two words
 * longer than the designer's comes down a point at a time until it fits, and a
 * seventh bullet on a slide with room for six is dropped rather than printed
 * over the footer.
 *
 * Dropping is the right answer and it is worth saying why. Nobody reads the
 * seventh bullet on a slide; they read the six above it and the mess at the
 * bottom of the page. A deck that quietly holds fewer points than the outline
 * asked for is a deck somebody can stand up and present.
 */
import type { ComposeOptions, DeckOutline, DeckSlide, DesignDocument } from './types';
import type { Theme } from './themes';
import type { TdLayout } from '../store/types';
/** The layout names `addPage` will take for a deck. */
export declare const DECK_PAGE_KINDS: DeckSlide['layout'][];
export declare function blankSlide(layout: DeckSlide['layout']): DeckSlide;
/** Fills a `{{school.*}}` line before it is measured. See `fieldFiller`. */
type Fill = (text: string) => string;
/** One slide, as a page of the design. Exported so `addPage` can make one. */
export declare function composeSlide(slide: DeckSlide, theme: Theme, fill?: Fill): TdLayout;
export declare function composeDeck(outline: DeckOutline, options?: ComposeOptions): DesignDocument;
export {};
