/**
 * The adjustments a photograph can be given: brightness, contrast, colour,
 * warmth, blur, and the two washes.
 *
 * They are CSS `filter` functions, applied to the picture itself rather than
 * to the widget round it, so a keyline stays crisp and a shadow keeps its
 * colour whatever is done to the photo inside them. The canvas widget and its
 * read-only twin both draw from here, so a page thumbnail and a slide show the
 * same photo the artboard does.
 *
 * Every value is a percentage of the untouched picture, 100 meaning "as it
 * came", except blur, which is a length in design pixels, and warmth, which
 * runs both ways from 0. A design carries only the keys that have been moved,
 * and none at all when nothing has, so a design saved before this existed
 * reads exactly as it did.
 *
 * html2canvas cannot draw a filter, so the exports pre-render a filtered
 * picture in the browser first — the same path a shadow takes — and a .pptx
 * gets a picture of the adjusted photo rather than the original with the
 * adjustments quietly dropped.
 */
export type TImageFilters = {
    brightness?: number;
    contrast?: number;
    saturation?: number;
    /** Positive is warmer, negative cooler; both are a wash, not a hue shift. */
    warmth?: number;
    /** Design pixels, not a percentage. */
    blur?: number;
    grayscale?: number;
    sepia?: number;
};
export type TImageFilterKey = keyof TImageFilters;
/** The untouched picture, which is also what Reset puts back. */
export declare const IMAGE_FILTER_DEFAULTS: Required<TImageFilters>;
/** The sliders, in the order the panel shows them, with the range each runs over. */
export declare const IMAGE_FILTER_SLIDERS: {
    key: TImageFilterKey;
    label: string;
    min: number;
    max: number;
}[];
export type TImageFilterPreset = {
    name: string;
    filters: TImageFilters | null;
};
/** A few looks to start from. Original is the absence of any. */
export declare const IMAGE_FILTER_PRESETS: TImageFilterPreset[];
/** Every adjustment, with the defaults filled in for whatever the widget left out. */
export declare function readImageFilters(filters: TImageFilters | null | undefined): Required<TImageFilters>;
/**
 * The same adjustments with everything at its default left out, and null when
 * that is all of them — which is what the widget should hold, so a photo put
 * back to how it came carries nothing.
 */
export declare function packImageFilters(filters: TImageFilters | null | undefined): TImageFilters | null;
/** True when nothing has been moved off its default. */
export declare function isUntouched(filters: TImageFilters | null | undefined): boolean;
/** The preset these adjustments are, if they are exactly one; otherwise null. */
export declare function matchImageFilterPreset(filters: TImageFilters | null | undefined): TImageFilterPreset | null;
/**
 * The `filter` for these adjustments, or undefined when there is nothing to do.
 *
 * Warmth is a sepia wash, which is what makes a photo read as warm; there is no
 * "cool" function in CSS, so a cool wash is the same sepia applied with the
 * hues turned half way round and turned back again, which lands the wash on
 * the blues instead of the yellows. The order matters: CSS applies the
 * functions left to right.
 */
export declare function imageFilterCss(filters: TImageFilters | null | undefined): string | undefined;
