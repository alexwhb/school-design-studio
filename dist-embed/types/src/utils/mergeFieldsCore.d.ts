import type { TdLayout, TdWidgetData } from '../store/types';
/** `{{ name }}` — braces around anything that is not a brace or a line break. */
export declare const FIELD_PATTERN: RegExp;
/** Given a field's name, its value — or `undefined` to leave the field standing. */
export type TFieldResolver = (name: string) => string | undefined;
/**
 * How two spellings of a field are compared: `{{Pupil}}`, `{{ pupil }}` and
 * `{{PUPIL}}` are the same column of the same list.
 */
export declare function fieldKey(name: string): string;
/** A resolver over a plain map, matched by `fieldKey`. */
export declare function valuesResolver(values: Record<string, string | undefined>): TFieldResolver;
/**
 * `&#37;` and `&amp;` back into the characters a reader sees.
 *
 * Never throws. Three readers sit on this — `sanitizeMarkup`, the `setMarkup`
 * op and `describeDocument` — and all three promise not to, and the planner
 * runs the first inside a validator, where an exception is a 500 for a person
 * who pasted an odd character. A reference that names no character is left as
 * it was written.
 */
export declare function decodeEntities(text: string): string;
/**
 * What a text widget's markup reads as, as plain text.
 *
 * Tags go, `<br>` and the edges of a block become one newline, entities are
 * decoded. This is what an LLM is shown of a page and what a field name is
 * matched in, so it has to be the words and nothing else.
 */
export declare function plainFromMarkup(html: string | undefined): string;
/** Whether a text box carries any field at all. */
export declare function hasFields(html: string | undefined): boolean;
/**
 * The fields a text box asks for, in reading order, each named once with the
 * spelling it was first written in.
 */
export declare function fieldsInText(html: string | undefined): string[];
/**
 * The markup with every resolvable field replaced by its value, without a DOM.
 *
 * The braces are matched in the markup itself, allowing tags between them, so a
 * field somebody bolded half of is still found. Fields nothing resolves are
 * left exactly as they were, which is how an author sees what is missing.
 *
 * A field inside a tag is the one place this can go wrong, because there the
 * value lands in an attribute rather than in the words. Two rules cover it.
 * A link is filled — `https://{{school.website}}` is how the link field says
 * "the school's own site" — and the finished address then has to pass the same
 * scheme check any other link does, so a value of `javascript:…` in the kit
 * takes the link off rather than arming it. Anywhere else inside a tag the
 * field is left standing: the editor never writes one there, the DOM path in
 * `mergeFields.ts` never fills one there, and a colour or a style is not a place
 * for a school's name. The value is escaped for an attribute either way, so a
 * quote in it cannot end the attribute and start another.
 */
export declare function fillMarkup(html: string | undefined, resolve: TFieldResolver): string;
/**
 * A value going into markup. Field values are words, not HTML.
 *
 * Quotes as well as angle brackets, because a value can land inside an
 * attribute — a link's address — and there a `"` would close the attribute and
 * let the rest of the value write new ones.
 */
export declare function escapeMarkup(value: string): string;
/**
 * Words going into the text of an element, where a quote is just a quote.
 *
 * `escapeMarkup` is the one to reach for when there is any doubt; this is for
 * a caller that builds the markup itself and knows the value is never put in
 * an attribute, so a composed "it's" is stored as it was typed.
 */
export declare function escapeText(value: string): string;
/** Every field on a page, deduplicated across its text boxes. */
export declare function fieldsInLayers(layers: TdWidgetData[]): string[];
/** Every field in a design, deduplicated across all of its pages. */
export declare function fieldsInLayouts(layouts: TdLayout[]): string[];
