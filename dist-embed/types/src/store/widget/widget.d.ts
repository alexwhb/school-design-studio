import type { TdLayout, TdWidgetData } from '../types';
type TUpdateWidgetKey = keyof TdWidgetData;
export type TUpdateWidgetPayload = {
    uuid: string;
    key: TUpdateWidgetKey;
    value: number | string | boolean | number[] | Record<string, any> | null;
};
export declare function getWidgets(): TdWidgetData[];
export declare function updateWidgetData({ uuid, key, value }: TUpdateWidgetPayload): void;
/**
 * Names a layer. Blank means unnamed, which shows the element's own text or the
 * kind of thing it is instead, so clearing a name hands the label back to the
 * artwork.
 */
export declare function renameWidget(uuid: string, label: string): void;
export type TUpdateWidgetMultiplePayload = {
    uuid: string;
    data: {
        key: TUpdateWidgetKey;
        value: number;
    }[];
};
export declare function updateWidgetMultiple({ uuid, data }: TUpdateWidgetMultiplePayload): void;
export declare function addWidget(setting: TdWidgetData): void;
export declare function deleteWidget(): void;
/**
 * Takes one named layer off the page, whatever is selected at the time.
 *
 * `deleteWidget` above deletes what you have chosen, which is the question the
 * Delete key and the menu are asking. This one is for a layer the editor is
 * withdrawing on its own account — a text box drawn and then left empty — where
 * the selection has usually moved on to whatever was clicked instead and
 * stealing it back to delete something would be the wrong answer.
 */
export declare function removeWidget(uuid: string): void;
export type TsetWidgetStyleData = {
    uuid: string;
    key: keyof TdWidgetData;
    value: any;
};
export declare function setWidgetStyle({ uuid, key, value }: TsetWidgetStyleData): void;
export declare function setDWidgets(e: TdWidgetData[]): void;
export declare function setDLayouts(data: TdLayout[]): void;
export declare function updateDWidgets(): void;
export declare function lockWidgets(): void;
export {};
