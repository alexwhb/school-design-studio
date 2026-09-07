/**
 * The fonts offered in the text panel.
 *
 * All files are bundled in public/fonts and declared in public/fonts/fonts.css,
 * so they are available offline and render identically in the editor and in
 * every export. See public/fonts/LICENSES.md for the licence of each family.
 */
export type TFontKind = 'sans' | 'serif' | 'display' | 'mono' | 'handwriting';
export type TFontItem = {
    id: number;
    oid: number;
    /** CSS font-family name, also what gets written into the design data */
    value: string;
    /** Name shown in the picker */
    alias: string;
    kind: TFontKind;
    url: string;
    preview: string;
};
/** Group headings shown in the font picker, in the order they appear. */
export declare const FONT_GROUPS: Record<TFontKind, string>;
/** The font a new text box starts with. */
export declare const DEFAULT_FONT: {
    id: number;
    oid: number;
    value: string;
    alias: string;
    url: string;
};
declare const fonts: TFontItem[];
export default fonts;
