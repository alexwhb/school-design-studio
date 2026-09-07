import { type TBrandKit, type TTemplateBrand } from '../../common/methods/brandKitCore';
import type { TdLayout, TdWidgetData, TPageState } from '../types';
export type TApplyBrandOptions = {
    fields: boolean;
    fonts: boolean;
    colors: boolean;
};
export type TApplyBrandOutcome = {
    /** Text boxes whose fields were filled, and how many pages they were on. */
    filled: number;
    fieldPages: number;
    /** School fields that had nothing to fill them and were left standing. */
    unresolved: number;
    /** Text boxes moved onto a brand font. */
    fonts: number;
    /** Layers and page backgrounds repainted. */
    recoloured: number;
    backgrounds: number;
    /** What the readability guard had to do afterwards. See `ensureReadable`. */
    readability: TReadabilityCounts;
};
/**
 * How big text has to be to count as a heading, on a given page.
 *
 * Four and a half per cent of the page's shorter side: 49px on a slide, 57px
 * on Letter paper at 150dpi. A fixed pixel size would call every line on a
 * poster a heading and nothing on a slide one, and a smaller fraction is no
 * better — at three per cent half the text in the bundled packs comes out a
 * heading, including the body copy of every poster. Bold text is a heading at
 * any size, which is what catches a table header or a run-in label.
 */
export declare function headingThreshold(page: Pick<TPageState, 'width' | 'height'>): number;
/**
 * Whether a colour is one of the design's neutrals: the whites, the blacks
 * and the greys, and the near-enough of each. Those are left alone — a brand
 * kit says what the school's colours are, not what colour the paper is.
 */
export declare function isNeutralColor(rgb: string): boolean;
/**
 * The design's colours, most used first, neutrals left out. Counted by the
 * places they are painted rather than by area: the colour a design is "in"
 * is the one it reaches for most often, not the one on its biggest shape.
 */
export declare function rankDesignColors(layouts: TdLayout[]): string[];
/**
 * Where one colour is already painted, so the Brand panel can say what
 * changing it would touch before it is changed. Transparency is ignored: a
 * wash of the school's navy at 7% is still the school's navy.
 */
export declare function countColorUsage(layouts: TdLayout[], color: string): {
    layers: number;
    pages: number;
};
export type TReadabilityCounts = {
    /** Text boxes whose own colour was moved, keeping its hue, until it could be read. */
    adjusted: number;
    /** Text boxes swapped between the paper and the ink, because moving them was not the answer. */
    swapped: number;
    /** Text boxes that could not be got to the target, and were left as legible as they could be. */
    unreadable: number;
    /** Decorative marks nudged, in their own hue, off a band they had disappeared into. */
    marks: number;
    /** Neutral marks — a white icon on what is now a pale band — swapped to the paper or the ink. */
    marksSwapped: number;
};
export declare function noReadabilityCounts(): TReadabilityCounts;
/**
 * Puts back the contrast the recolour took away.
 *
 * Swapping a template's colours for the school's is a swap of hues, and hues
 * carry lightness with them. The Field Day poster is a white headline on a
 * navy band and a navy sub-heading on cream; a school whose primary is a pale
 * yellow gets a white headline on pale yellow — which is nothing — and a pale
 * yellow sub-heading on cream, which is nearly nothing. Neither is a bug in
 * the template or in the kit. It is what happens when two independent choices
 * meet, and it has to be repaired afterwards rather than prevented.
 *
 * So: every text box that the colour pass either painted or moved the ground
 * out from under is checked against WCAG's targets for its size, and the two
 * repairs are the two the situation allows. Text that was a neutral — white on
 * a band — swaps to whichever of the paper and the ink can be read, because a
 * white headline made grey is neither. Text in one of the school's own colours
 * is darkened or lightened in its own hue, because that keeps the design in the
 * school's colours; only if that cannot reach the target does it fall back to
 * ink or paper. Either way the aim is a margin past the target rather than the
 * target itself — see AIM_MARGIN in contrast.ts.
 *
 * Nothing else is touched. Text over a photograph, over a gradient or over
 * anything this cannot see under is left as it was drawn, and the colours a
 * text effect brought with it — the second tone of a check, a white outline —
 * stay as they are; only the parts of the stack that were following the text's
 * own colour follow it here too.
 */
export declare function ensureReadable(layers: TdWidgetData[], page: TPageState, kit: TBrandKit): TReadabilityCounts;
/**
 * Pushes the kit onto every page of `layouts`, in place.
 *
 * Fields first, then fonts, then colours, each only if asked. The colour pass
 * maps the design's colours to the brand's in order — its most-used to the
 * primary, its second to the second — and keeps each place's own alpha, so a
 * wash that was the old navy at 7% comes out as the new blue at 7%.
 */
export declare function applyBrandToLayouts(layouts: TdLayout[], kit: TBrandKit, options: TApplyBrandOptions): TApplyBrandOutcome;
/** The outcome as a sentence for the notification. */
export declare function describeBrandOutcome(outcome: TApplyBrandOutcome): string;
export type TTemplateBrandResult = {
    layers: TdWidgetData[];
    page: TPageState;
    /** Places repainted, the page background among them. */
    recoloured: number;
    /** Text boxes moved onto one of the kit's fonts. */
    fonts: number;
    /** What the readability guard had to do afterwards. See `ensureReadable`. */
    readability: TReadabilityCounts;
};
/**
 * A template in the school's colours and fonts, as it lands.
 *
 * Apply brand has to guess which of a design's colours is the main one, by
 * counting where each is painted, because a design made before the kit never
 * said. A template can say: its `brand` block names which of its own colours
 * plays which role, so the answer is looked up rather than ranked, and adding
 * the same template twice gives the same design both times. Each place keeps
 * its own transparency, so a wash of the template's navy at 7% comes out as
 * the school's first colour at 7%.
 *
 * Pure: the layers and the page given are read and never written, and what
 * comes back is a copy — the template object the API returned is shared with
 * whatever cached it, and the kit belongs to the Brand panel. When there is
 * nothing to do the same objects come back, so a caller can tell by identity.
 */
export declare function applyTemplateBrand(layers: TdWidgetData[], page: TPageState, brand: TTemplateBrand | undefined, kit: TBrandKit): TTemplateBrandResult;
