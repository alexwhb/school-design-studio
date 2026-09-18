export type TMenuItemData = {
    left: number;
    top: number;
    list: TWidgetItemData[];
};
export declare const menuList: TMenuItemData;
export type TWidgetItemData = {
    type: 'copy' | 'paste' | 'duplicate' | 'index-up' | 'index-down' | 'index-front' | 'index-back' | 'lock' | 'hide' | 'del' | 'group' | 'ungroup';
    text: string;
};
export declare const widgetMenu: TWidgetItemData[];
/**
 * More than one thing selected. Everything here works on the whole selection,
 * which is why the stacking moves are not: they take one layer through the
 * order, and "bring these four forward" has no single answer.
 */
export declare const multiMenu: TWidgetItemData[];
export declare const pageMenu: TWidgetItemData[];
