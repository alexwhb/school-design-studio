/**
 * Shared helpers for turning a design into an exported file.
 *
 * The editor stores a page in CSS pixels; PowerPoint works in inches and
 * points. Everything here converts between the two and normalises the odd
 * shapes the editor's data can take (8-digit hex colours, contenteditable
 * HTML, remote image URLs).
 */
/**
 * Rejects if `work` has not settled in time.
 *
 * Every await in the export path — a fetch, an image decode, html2canvas
 * itself — can in principle never settle, and when one of them doesn't the
 * export does not fail, it stops: progress frozen, no error, nothing to do but
 * reload. A bound turns any of those into an ordinary failure the caller can
 * report or fall back from.
 */
export declare function withTimeout<T>(work: Promise<T>, ms: number, label: string): Promise<T>;
/** The editor treats a design pixel as a CSS pixel, which is 1/96 of an inch. */
export declare const PX_PER_INCH = 96;
/** PowerPoint measures type in points: 72 per inch. */
export declare const PT_PER_PX: number;
export declare const pxToInches: (px: number) => number;
export declare const pxToPoints: (px: number) => number;
export type PptxColor = {
    color: string;
    transparency?: number;
};
/**
 * The editor writes colours as #rgb, #rrggbb or #rrggbbaa, and occasionally as
 * rgb()/rgba(). PowerPoint wants a bare RRGGBB plus a separate 0–100
 * transparency, so split them apart.
 */
export declare function toPptxColor(input?: string, fallback?: string): PptxColor;
/** True when the colour is fully transparent, so it is not worth drawing. */
export declare function isInvisible(input?: string): boolean;
/**
 * Text widgets hold contenteditable HTML. Turn it back into plain text,
 * keeping the line breaks, because a PowerPoint text box takes a string.
 */
export declare function htmlToText(html?: string): string;
/** Reads the rotation, in degrees, out of a widget's transform string. */
export declare function readRotation(widget: Record<string, any>): number;
/**
 * PowerPoint needs image bytes, not a URL. Fetch the image and base64 it.
 *
 * Falls back to drawing it on a canvas, which covers images the browser has
 * already cached but will not hand over via fetch. Returns null when the image
 * cannot be read at all (a cross-origin host with no CORS headers), or when a
 * host simply never answers, so the caller can skip it rather than produce a
 * corrupt file or wait forever.
 *
 * An SVG is the one thing that is NOT passed through. OOXML has carried SVG
 * since 2016 and PowerPoint draws it, but Keynote's importer, Google Slides and
 * every copy of Office older than that show a gap instead — and a school opens
 * a deck on whatever is in the building. It is exactly the reason WebP is not
 * an upload format here. So a vector is drawn onto a canvas at twice the size
 * it is laid out at and embedded as PNG: it prints as sharply as the slide can
 * show it, and it arrives everywhere.
 *
 * `at` is the size it is drawn at. Worth passing for a vector and ignored for
 * everything else — an SVG with only a `viewBox` has no intrinsic size, and a
 * browser asked to draw one anyway invents 300x150.
 */
export declare function imageToDataUrl(url: string, at?: {
    width: number;
    height: number;
}): Promise<string | null>;
/**
 * Turns a `data:` URL back into a Blob.
 *
 * Decoded by hand rather than with `fetch(dataUrl)` because a page's
 * Content-Security-Policy can refuse to connect to a data: URL, and an export
 * that only works on some deployments is worse than no shortcut at all.
 */
export declare function dataUrlToBlob(dataUrl: string): Blob;
export declare function blobToDataUrl(blob: Blob): Promise<string>;
/** Makes a filename safe to save on Windows and macOS. */
export declare function safeFileName(name: string, extension: string): string;
