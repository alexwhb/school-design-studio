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
/** `&#37;` and `&amp;` back into the characters a reader sees. */
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
 */
export declare function fillMarkup(html: string | undefined, resolve: TFieldResolver): string;
/** A value going into markup. Field values are words, not HTML. */
export declare function escapeMarkup(value: string): string;
/** Every field on a page, deduplicated across its text boxes. */
export declare function fieldsInLayers(layers: TdWidgetData[]): string[];
/** Every field in a design, deduplicated across all of its pages. */
export declare function fieldsInLayouts(layouts: TdLayout[]): string[];
