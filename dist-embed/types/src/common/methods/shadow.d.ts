/**
 * The shadow a picture or a shape can cast.
 *
 * Text has had shadows all along as one feature of a stacked text effect;
 * images and shapes had nothing at all. They get this instead: a single shadow,
 * drawn as a CSS `filter`, so it follows what the artwork actually paints — the
 * silhouette of a cut-out PNG, the outline of a shape, the rounded corners of a
 * photo — rather than the rectangle it happens to sit in, which is all
 * `box-shadow` could give.
 *
 * The canvas widget and its read-only twin both draw from here, so a page
 * thumbnail and a slide cast the same shadow as the artboard does.
 */
export type TWidgetShadow = {
    enable: boolean;
    color: string;
    offsetX: number;
    offsetY: number;
    blur: number;
};
/** A soft shadow cast straight down, which is what most artwork wants. */
export declare const defaultWidgetShadow: () => TWidgetShadow;
/** The `filter` for a shadow, or undefined when there is nothing to draw. */
export declare function shadowFilter(shadow?: TWidgetShadow | null): string | undefined;
