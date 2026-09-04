/**
 * Fields that are interpolated somewhere, checked before they can be.
 *
 * A design is JSON, and most of what is in it only ever reaches a style
 * property or a text node, where the browser does the escaping. Two kinds do
 * not: the URLs (`URL_FIELDS`), which the host checks against its own origin,
 * and the ones listed in `SANITISED_FIELDS`, which the editor writes into
 * something that parses.
 *
 * Today that is one field. `fontClass.value` is put into a `<style>` element as
 * `@font-face { font-family: "…" }`, and that element's markup is appended to
 * the document's head — so a family called `"; } body { … ` would be writing
 * CSS into the host's page. Nothing reaches that code at the moment: it is
 * behind `supportSubFont`, which is off. But the value comes out of a stored
 * document, and a field whose safety rests on a flag staying off is a field
 * that is unsafe. It is checked on the way in instead, where the answer does
 * not depend on which code path happens to run.
 *
 * Dropped rather than escaped. A font family is a name from a short list; one
 * that is not on the list is not a font, and the text falls back to the
 * editor's default, which is visible and obvious rather than silently wrong.
 */
import { SAFE_FONT_FAMILY, SANITISED_FIELDS } from '../components/modules/widgets/widgetTypes';
import type { DesignDocument } from './types';
export { SAFE_FONT_FAMILY, SANITISED_FIELDS };
/** What was taken out, so a caller can say so rather than wonder. */
export type FieldReport = {
    dropped: {
        type: string;
        path: string;
        value: string;
    }[];
};
/**
 * The document with every interpolated field that does not pass taken out.
 *
 * Works on a copy, so a host can hand in a document it is still holding. Every
 * way a document enters the editor goes through this — the `document` prop,
 * `setDocument`, and `applyOps` — so there is no route in that skips it.
 */
export declare function sanitizeFields(doc: DesignDocument): {
    doc: DesignDocument;
    report: FieldReport;
};
