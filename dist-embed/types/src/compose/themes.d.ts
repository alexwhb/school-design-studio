/** The slide themes the studio ships, by the name a caller passes as `theme`. */
export declare const SLIDE_THEME_KEYS: readonly ["editorial", "swiss", "academic", "dark", "pastel"];
export type SlideThemeKey = (typeof SLIDE_THEME_KEYS)[number];
/**
 * The poster packs, named for the colour each is built on. All three come out
 * of the school-events pack, which is one identity in three palettes.
 */
export declare const POSTER_PACK_KEYS: readonly ["navy", "crimson", "forest"];
export type PosterPackKey = (typeof POSTER_PACK_KEYS)[number];
export type FontChoice = {
    alias: string;
    id: number;
    url: string;
    value: string;
};
export type Theme = {
    key: string;
    /** The page's own colour. */
    paper: string;
    /** Words, at full strength. */
    ink: string;
    /** Words that are not the point of the page. */
    muted: string;
    /** The one colour that is the school's, and the first thing a brand kit takes over. */
    accent: string;
    /** A second accent when the theme has one, otherwise the same as `accent`. */
    accentSoft: string;
    /** Hairlines and dividers. */
    rule: string;
    display: FontChoice;
    body: FontChoice;
    eyebrow: FontChoice;
    /** How the display face is set on this theme. */
    displayWeight: number;
    displayLineHeight: number;
    displayTracking: number;
    /** How far an eyebrow is tracked out, at 24px. */
    eyebrowTracking: number;
};
/** Read once, on the first ask. A theme is the same every time it is read. */
export declare function slideTheme(key: string | undefined): Theme;
export declare function posterPack(key: string | undefined): Theme;
