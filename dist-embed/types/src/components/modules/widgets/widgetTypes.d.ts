/**
 * Every kind of thing a design can hold, and where each of them keeps a URL.
 *
 * Split out from `registry.ts` because that file imports the React components
 * and this has to be readable by `design-studio/compose`, which runs on a
 * server. It is not a copy of the registry: the registry's two maps are typed
 * as `Record<TWidgetType, …>`, so a widget added to one and not the other fails
 * the build. That is the only guarantee worth having — a list kept in step by
 * hand is a list that drifts on the day somebody is in a hurry.
 *
 * The planner validates a design against these before storing it: every layer's
 * `type` has to be one it knows, and every URL-bearing field has to be
 * same-origin or a data URL, because a design that points at somebody else's
 * server stops rendering the day that server changes its mind.
 */
export declare const WIDGET_TYPES: readonly ["w-text", "w-image", "w-svg", "w-rect", "w-ellipse", "w-polygon", "w-path", "w-group", "w-qrcode", "w-table"];
export type TWidgetType = (typeof WIDGET_TYPES)[number];
/** The page itself, which is not a widget but carries a picture of its own. */
export declare const PAGE_TYPE = "page";
/**
 * Per type, the fields carrying a URL or a piece of inline markup.
 *
 * Both, and not only URLs, because both are things the host has to look at
 * before it stores them: a `svgUrl` is usually a whole `<svg>` document rather
 * than an address, and a text widget's `text` is HTML. Run the markup ones
 * through `sanitizeMarkup` and check the addresses against your own origin.
 *
 * `page` is in here too. A page background is a picture like any other and is
 * the one people forget, because it is not on a layer.
 */
export declare const URL_FIELDS: Record<string, readonly string[]>;
/**
 * URLs that are not a field of the layer but a field of something inside it.
 *
 * `URL_FIELDS` is a flat list of names because that is what most of them are.
 * These two are not, and a host that checked only the flat list would let a
 * document point at somebody else's server through either of them: a text
 * effect can be filled with a picture, and a font can name the file it is
 * loaded from. Neither is something a person types — the editor writes both
 * from its own bundled lists — which is exactly why a document arriving from
 * outside should be made to prove it.
 *
 * Paths are dotted, with `[]` for "every element of this array".
 */
export declare const NESTED_URL_PATHS: Record<string, readonly string[]>;
/**
 * A font family name the editor is willing to write into a stylesheet.
 *
 * Letters, digits, spaces, underscores and hyphens, and no more than sixty-four
 * of them. Every family the editor bundles fits — "IBM Plex Mono", "Source
 * Serif 4", "Libre Baskerville" — and nothing that fits can end a CSS string,
 * open a rule, or start a comment, which is the whole job. The space has to be
 * in the list: without it nine of the twenty-seven bundled families are
 * rejected, which is every two-word one.
 */
export declare const SAFE_FONT_FAMILY: RegExp;
/**
 * Fields that are neither a URL nor markup, and are still interpolated into
 * something that parses.
 *
 * `fontClass.value` is written into a `<style>` element as
 * `@font-face { font-family: "…" }` and that element's markup is appended to
 * the document's head. Nothing reaches that today — it is behind
 * `supportSubFont`, which is off — but the value comes from a stored document,
 * and a field whose safety rests on a feature flag staying off is a field that
 * is unsafe. `sanitizeFields` in `design-studio/compose` drops any that do not
 * match `SAFE_FONT_FAMILY`, and every way a document enters the editor goes
 * through it.
 *
 * Paths are dotted, as in `NESTED_URL_PATHS`.
 */
export declare const SANITISED_FIELDS: Record<string, readonly string[]>;
/**
 * Per type, every field whose value is painted: written into CSS or SVG as a
 * colour, or as a gradient of colours.
 *
 * A second channel for pictures, and the one nobody was checking. CSS takes an
 * image anywhere it takes a paint, so a shape whose `color` is `url(/x)` drew
 * a picture, and none of these are in `URL_FIELDS`, which is where a host looks
 * for addresses to hold to its own origin. Every value here must pass
 * `isSafePaint` in `design-studio/compose`: a colour, or a gradient built only
 * from colours, angles and stops. `sanitizeFields` resets one that does not.
 *
 * Found by reading every renderer — the canvas widget, its static twin, the
 * shared paint helpers, the page background — not by guessing from names. The
 * page is `page`, as in `URL_FIELDS`. Paths are dotted, with `[]` for "every
 * element of this array", as in `NESTED_URL_PATHS`.
 */
/**
 * Words a person wrote about a widget rather than on it: plain text, never
 * markup, and never fetched. Today that is a picture's alt text. It reaches a
 * React attribute, a PowerPoint's XML and a PDF string, each of which escapes
 * it, so the check on the way in is only that it is a string of a sensible
 * length; see `sanitizeFields`. `decorative` beside it must be a boolean.
 */
export declare const TEXT_FIELDS: Record<string, readonly string[]>;
/** The longest alt text a design keeps. Anything past it is cut on the way in. */
export declare const MAX_ALT_LENGTH = 500;
export declare const PAINT_FIELDS: Record<string, readonly string[]>;
/**
 * Numbers that are written into a paint, so have to be numbers.
 *
 * A text effect's gradient keeps its angle apart from its stops and is
 * assembled as `linear-gradient(${angle}deg, …)`, so an angle that is a string
 * — `0deg, url(/x)` — is a paint of its own. `sanitizeFields` resets one that
 * is not a finite number.
 */
export declare const PAINT_NUMBER_FIELDS: Record<string, readonly string[]>;
