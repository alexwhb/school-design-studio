/**
 * The shapes the planner and the editor agree on.
 *
 * A `DesignDocument` is the whole of what the host stores: a format tag, a
 * name, and one `TdLayout` per page — exactly the array the widget store holds,
 * so handing one to `<DesignStudio document={…}/>` and reading one back out of
 * `getDocument()` are the same thing in both directions with nothing lost.
 */
import type { TdLayout } from '../store/types';
import type { TBrandKit } from '../common/methods/brandKitCore';
export type { TdLayout, TBrandKit };
export type DesignDocument = {
    /** Format tag, so a stored blob can be recognised and migrated later. */
    format: 'design-studio/v1';
    title: string;
    /** One per page, exactly as the widget store holds them. */
    layouts: TdLayout[];
};
/**
 * What a document is for.
 *
 * `slides` is 1920 × 1080, the template panel offers slide templates only, and
 * the presenter and the speaker notes are there. `poster` is Letter portrait at
 * 150 DPI — 1275 × 1650 — the panel offers posters, flyers, signs and awards,
 * and there is nothing to present.
 */
export type DesignKind = 'slides' | 'poster';
export declare const SLIDE_PAGE: {
    readonly width: 1920;
    readonly height: 1080;
};
export declare const POSTER_PAGE: {
    readonly width: 1275;
    readonly height: 1650;
};
export declare function pageSizeFor(kind: DesignKind): {
    width: number;
    height: number;
};
/** A picture the host has already resolved. Never an id, never bytes to fetch. */
export type ImageRef = {
    url: string;
    width: number;
    height: number;
};
/** A bullet, and the points made under it. */
export type OutlineBullet = {
    text: string;
    sub: string[];
};
export type DeckSlideLayout = 'title' | 'statement' | 'content' | 'two-column' | 'media';
export type DeckSlide = {
    layout: DeckSlideLayout;
    title: string | null;
    kicker: string | null;
    sub: string | null;
    bullets: OutlineBullet[];
    bulletsRight: OutlineBullet[];
    columnHeads: string[];
    callout: string | null;
    notes: string | null;
    image: ImageRef | null;
};
export type DeckOutline = {
    title: string;
    slides: DeckSlide[];
};
export type PosterSignLayout = 'direction' | 'icon' | 'statement' | 'number' | 'notice';
export type PosterSign = {
    layout: PosterSignLayout;
    /** A sticker key the studio ships. One it does not know is dropped. */
    icon: string | null;
    eyebrow: string | null;
    badge: string | null;
    head: string;
    sub: string | null;
    foot: string | null;
};
export type PosterOutline = {
    orientation: 'LANDSCAPE' | 'PORTRAIT';
    size: 'letter' | 'tabloid' | 'banner';
    signs: PosterSign[];
};
export type ComposeOptions = {
    /** A slide theme key, or a poster pack key. Anything else falls back. */
    theme?: string;
    brand?: TBrandKit;
};
export type DesignOp = 
/** Words. Always escaped — `<b>` lands on the page as the characters `<b>`. */
{
    op: 'setText';
    id: string;
    text: string;
}
/**
 * Markup, for a host round-tripping the editor's own output. It goes through
 * the allowlist first, so what is stored is what a design may hold whatever
 * was sent. Anything that came from a person or a model wants `setText`.
 */
 | {
    op: 'setMarkup';
    id: string;
    html: string;
} | {
    op: 'setImage';
    id: string;
    url: string;
    width: number;
    height: number;
} | {
    op: 'addPage';
    after: number;
    kind: string;
    fields: Record<string, string>;
} | {
    op: 'removePage';
    index: number;
} | {
    op: 'movePage';
    from: number;
    to: number;
} | {
    op: 'applyBrand';
};
export type RejectedOp = {
    op: DesignOp;
    reason: string;
};
/**
 * What an LLM is shown of a design. Text only, and never a data URL or a byte
 * of a picture — a page carrying a photograph would otherwise be megabytes of
 * base64 in a prompt.
 */
export type DocumentView = {
    title: string;
    kind: DesignKind | 'unknown';
    pages: Array<{
        index: number;
        width: number;
        height: number;
        texts: Array<{
            id: string;
            role: string | null;
            text: string;
        }>;
        images: Array<{
            id: string;
            alt: string | null;
        }>;
        notes: string | null;
    }>;
};
