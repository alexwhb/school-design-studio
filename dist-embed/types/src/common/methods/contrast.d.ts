/** The two ends a poster is printed between: the paper and the ink. */
export declare const PAPER = "#ffffffff";
export declare const INK = "#000000ff";
export type TRgba = {
    r: number;
    g: number;
    b: number;
    a: number;
};
/**
 * A colour as three channels and an alpha, all 0..1 for the alpha and 0..255
 * for the rest. Takes the four spellings the editor stores — `#rgb`, `#rrggbb`,
 * `#rrggbbaa`, and any of those without the hash, which is how a template's
 * `brand` block writes them. Anything else, a gradient included, is null: a
 * gradient has no one colour to compare against, and the caller has to decide
 * what to do about that rather than being handed a guess.
 */
export declare function parseColor(value: unknown): TRgba | null;
/** The colour back as the editor stores one: `#rrggbbaa`, lower case. */
export declare function formatColor({ r, g, b, a }: TRgba): string;
/**
 * How much light a colour gives back, 0 for black and 1 for white. Alpha is
 * ignored: a translucent colour has no luminance of its own until it is over
 * something, which is what `composite` is for.
 */
export declare function relativeLuminance(color: string): number;
/**
 * WCAG's contrast ratio between two colours: 1 when they are the same, 21 for
 * black on white. Symmetric — which of the pair is the text and which the
 * paper makes no difference to the number, only to what you do about it.
 */
export declare function contrastRatio(a: string, b: string): number;
/**
 * A translucent colour laid over an opaque one, as the one colour a viewer
 * sees. A 7% wash of navy over cream is a very slightly cool cream, and it is
 * that cream the text on top has to be read against — comparing against the
 * navy would condemn every line sitting on a tint.
 */
export declare function composite(color: string, backdrop: string): string;
/**
 * How many design pixels make an inch of this page.
 *
 * A page is stored in pixels and records nothing about how big it is meant to
 * be, so the only clue is its shape: a page that matches a sheet of paper was
 * built on the 150 the presets and the PDF use, and anything else — a slide, a
 * banner, a social square — is a screen at the CSS 96. It matters here because
 * WCAG's "large text" is a physical size, and 44px on a Letter poster is a
 * third of an inch while 44px on a slide is not.
 */
export declare function pageDpi(page: {
    width: number;
    height: number;
}): number;
/**
 * Whether WCAG would call this line large text, and so let it pass at 3:1
 * rather than 4.5:1: 18pt, or 14pt bold, converted to whatever a pixel is
 * worth on this page.
 */
export declare function largeText(fontSize: number, bold: boolean, page: {
    width: number;
    height: number;
}): boolean;
/** What a line of this size has to reach to be readable. Decorative marks use `DECORATIVE_TARGET`. */
export declare function contrastTarget(fontSize: number, bold: boolean, page: {
    width: number;
    height: number;
}): number;
/** What a rule, an icon or a border has to reach against what it is drawn on. */
export declare const DECORATIVE_TARGET = 3;
/**
 * Whichever of the candidates reads best on this surface. Ties go to the
 * earlier one, so a caller that puts the colour the text already was first
 * keeps it when nothing is gained by changing.
 */
export declare function readableOn(surface: string, candidates: string[]): string;
export type TAdjustResult = {
    /** The colour to use — the one given back unchanged when it already passed, or gave up. */
    color: string;
    /** What it reaches against the surface. */
    ratio: number;
    /**
     * Whether it got to the target — the plain one, not the aim. False means the
     * caller has to fall back to ink or paper.
     */
    met: boolean;
    /** Whether the colour was actually moved. */
    changed: boolean;
};
/**
 * The nearest shade of the same colour that can be read on this surface.
 *
 * Hue and saturation are held and only lightness moves, because the school's
 * colour has to still look like the school's colour: a pale yellow that has to
 * darken to be read on cream comes out as a deeper yellow, not as brown and
 * not as black. It moves away from the surface — darker on light paper,
 * lighter on a dark band — in small steps, until it is a margin clear of the
 * target rather than sitting on it; see AIM_MARGIN.
 *
 * The shift is bounded. A colour that cannot reach the target inside that
 * bound says so rather than walking all the way to black, and the caller
 * decides what to do instead; walking to black would technically pass and
 * would have thrown the palette away to do it.
 */
export declare function adjustForContrast(color: string, surface: string, target: number): TAdjustResult;
