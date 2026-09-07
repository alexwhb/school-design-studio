import { type TFieldResolver } from './mergeFieldsCore';
import type { TdLayout, TdWidgetData } from '../store/types';
export { FIELD_PATTERN, fieldKey, valuesResolver, hasFields, fieldsInText, fieldsInLayers, fieldsInLayouts, plainFromMarkup } from './mergeFieldsCore';
export type { TFieldResolver } from './mergeFieldsCore';
/**
 * The markup with every resolvable field replaced by its value. Fields the
 * resolver declines are left in place.
 *
 * Worked back to front, one hit at a time, so each splice happens at offsets
 * that are still true: replacing a later field cannot move an earlier one.
 */
export declare function fillText(html: string | undefined, resolve: TFieldResolver): string;
/**
 * A copy of the widget with its fields filled, or the same widget if nothing
 * changed — so callers can tell the two apart by identity.
 */
export declare function fillWidget(widget: TdWidgetData, resolve: TFieldResolver): TdWidgetData;
/** Every text box on a page filled. Reports how many boxes changed. */
export declare function fillLayers(layers: TdWidgetData[], resolve: TFieldResolver): {
    layers: TdWidgetData[];
    filled: number;
};
/** A page with its text boxes filled. The page's own settings are untouched. */
export declare function fillLayout(layout: TdLayout, resolve: TFieldResolver): {
    layout: TdLayout;
    filled: number;
};
/**
 * Whether `query` reads as a field name this text box would accept — used by
 * dialogs to tell "you typed {{Grade}} but the list has no Grade column" apart
 * from a typo in the braces.
 */
export declare function mentionsField(html: string | undefined, name: string): boolean;
