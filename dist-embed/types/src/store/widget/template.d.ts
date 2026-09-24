import { type TTemplateBrand } from '../../common/methods/brandKit';
import type { TdLayout, TdWidgetData } from '../types';
/**
 * Saved elements store their text URL-encoded and templates store it raw (see
 * CONTENT.md), and both arrive here. Decoding raw text is a no-op — unless it
 * carries a literal `%`, which decodeURIComponent throws on. "50% off" is
 * ordinary school copy, so a text that will not decode is taken as it is.
 */
export declare function decodeText(text: string): string;
/**
 * Puts a one-page template's layers on the page.
 *
 * Picking a template in the gallery comes through here, and so does opening a
 * single-page one with `?tempid=`, so this is where the school's fields are
 * filled in: `{{school.name}}` becomes the school's name, or the sample one
 * when no kit has been set up. See brandKit.ts. A template of several pages
 * arrives as layouts instead and goes through `fillTemplateLayouts`; a saved
 * *design* goes through neither, because its fields were filled when it was
 * made and refilling them would overwrite whatever was typed since.
 *
 * `brand` is the block the template file carries beside its data, saying which
 * of its own colours plays which role. It only ever comes from a template, for
 * the same reason the fill does: a design opened again is what someone left,
 * not what the kit says today.
 */
export declare function setTemplate(allWidgets: TdWidgetData[], brand?: TTemplateBrand): void;
/**
 * The same fill for a template that is a whole deck: every page of it, before
 * the layouts are handed to the store, and the kit's colours and fonts with
 * it. Returns a new list; the layouts given are left alone.
 */
export declare function fillTemplateLayouts(layouts: TdLayout[], brand?: TTemplateBrand): TdLayout[];
