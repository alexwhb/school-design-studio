/**
 * The brand kit itself: what is in one, what its colours mean, and how it
 * answers a `{{school.*}}` field.
 *
 * Pure on purpose. `brandKit.ts` beside this holds the editor's live kit and
 * writes it to the browser, both of which need valtio and IndexedDB; the
 * compose entry runs on a server and needs none of that, only the rules. So the
 * rules are here and the storage is there, and `brandKit.ts` re-exports every
 * name below so nothing that already imported one has to change.
 */
import { type TFontItem } from '../../assets/data/FontsData';
import { type TFieldResolver } from '../../utils/mergeFieldsCore';
export type TBrandLogo = {
    /** A data URL, like an upload, so it survives being saved into a design. */
    url: string;
    width: number;
    height: number;
};
export type TBrandFonts = {
    /** Font ids from FontsData; absent means "not chosen". */
    heading?: number;
    body?: number;
};
export type TBrandKit = {
    name: string;
    shortName: string;
    tagline: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    logo?: TBrandLogo;
    /** Ordered: the first is the primary. No more than MAX_BRAND_COLORS. */
    colors: string[];
    fonts: TBrandFonts;
};
/** As many as there are roles a template can name; see `BRAND_ROLES`. */
export declare const MAX_BRAND_COLORS = 8;
/** The written details, which are also the merge fields. */
export declare const BRAND_DETAIL_KEYS: readonly ["name", "shortName", "tagline", "address", "phone", "email", "website"];
export type TBrandDetailKey = (typeof BRAND_DETAIL_KEYS)[number];
/** Each field as it is typed into a text box, the detail it reads, and what to call it. */
export declare const BRAND_FIELDS: {
    field: string;
    key: TBrandDetailKey;
    label: string;
}[];
/**
 * What a field reads as for someone who has not set up a kit. These are the
 * strings the bundled templates used to carry outright, so with no kit a
 * template looks exactly as it did before it carried fields.
 */
export declare const SAMPLE_BRAND: Record<TBrandDetailKey, string>;
export declare function emptyBrandKit(): TBrandKit;
/** Whether any of the written details has been filled in. */
export declare function hasBrandDetails(kit: TBrandKit): boolean;
/** Whether there is anything in the kit at all for Apply brand to apply. */
export declare function hasBrandContent(kit: TBrandKit): boolean;
/**
 * A colour as the editor stores one: `#rrggbbaa`, lower case. Accepts the
 * three shorter spellings too, and refuses anything that is not a flat hex
 * colour — a gradient is not a brand colour.
 */
export declare function normaliseBrandColor(value: string): string | null;
/**
 * What one of a template's own colours is *for*.
 *
 * A template that says which of its colours is the primary, which the
 * secondary and which the accent can be recoloured the moment it is added,
 * without guessing: the school's first colour goes wherever the template said
 * primary, at whatever transparency that place was painted at. The names run
 * out at eight because the kit holds eight, and they are positions rather than
 * descriptions for the same reason `brandColorRole` is — "primary" is the
 * first colour of the kit, not a shade of blue.
 */
export declare const BRAND_ROLES: readonly ["primary", "secondary", "accent", "colour4", "colour5", "colour6", "colour7", "colour8"];
export type TBrandRole = (typeof BRAND_ROLES)[number];
/**
 * The `brand` block a template file carries beside its `data`. Keys are the
 * template's colours as lower case six-digit hex without `#` and without
 * alpha; every place one of them is painted follows its role's kit colour.
 * `keep` is the opt-out for a design whose palette and fonts are the point.
 */
export type TTemplateBrand = {
    colors: Record<string, TBrandRole>;
    keep?: boolean;
};
/** Which of the kit's ordered colours a role asks for, or -1 for a name nobody defined. */
export declare function brandRoleIndex(role: string): number;
/**
 * What to call the nth colour of the kit.
 *
 * The kit stores an order, not names: the first colour is the school's main
 * one everywhere it is used, so the label follows the position rather than
 * being typed in and then left behind when the order changes.
 */
export declare function brandColorRole(index: number): string;
/**
 * A one-word name for a colour — navy, gold, paper — so two blues in a list
 * can be told apart at a glance without reading their hexes. It is the
 * nearest common name for the hue, not a match, and it is only ever shown
 * beside the swatch it describes.
 */
export declare function brandColorTone(color: string): string;
export declare function brandFont(id: number | undefined): TFontItem | undefined;
/**
 * The kit's fonts as a list, heading first, each named once — a kit that uses
 * one family for both is one entry, not two of the same.
 */
export declare function brandFontItems(chosen: TBrandFonts): TFontItem[];
/**
 * Answers `school.*` fields from a kit.
 *
 * A kit with nothing written in it answers with the samples, so the bundled
 * templates read as they always have. A kit with anything written in it
 * answers only what it has: an empty email is left as `{{school.email}}`, not
 * quietly filled with somebody else's, so the author can see what is missing.
 * Anything that is not a school field is declined, which is what lets another
 * resolver be composed after this one.
 */
export declare function brandResolver(kit: TBrandKit): TFieldResolver;
/** Whether a field name is one of the school's, whatever its spelling or modifier. */
export declare function isBrandField(name: string): boolean;
/**
 * A kit as it came from the database or the host, made safe to use: every
 * detail a string, colours the editor can paint with, fonts the list still
 * has. A host handing in a font id from a list that has since changed should
 * get "not chosen", not a text box in a font nobody bundled.
 */
export declare function normaliseBrandKit(input: Partial<TBrandKit> | null | undefined): TBrandKit;
