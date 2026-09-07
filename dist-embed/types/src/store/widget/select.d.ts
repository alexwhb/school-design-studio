export type TSelectWidgetData = {
    uuid: string;
};
export declare function selectWidget({ uuid }: TSelectWidgetData): void;
export declare function selectWidgetsInOut({ uuid }: TSelectWidgetData): void;
export type TselectItem = {
    data?: Record<string, any> | null;
    type?: string;
};
export declare function setSelectItem({ data, type }: TselectItem): void;
/**
 * Ctrl/Cmd + A. Takes every top-level layer on the page as the selection —
 * a group counts as one thing, so its container comes in and its children stay
 * out, and locked layers are left alone the same way a drag box leaves them.
 * Hidden layers are not there to be selected at all.
 *
 * A single layer is made active rather than multi-selected: that is what one
 * click does, and the panels read the two states differently.
 */
export declare function selectAllWidgets(): void;
/**
 * A drag box that caught a single layer leaves a selection of one, which is a
 * shape nothing else in the editor produces: clicking a layer makes it the
 * active element instead, and the panels read the two states differently.
 * Settle it the way a click would, so one layer is one layer however it was
 * chosen.
 */
export declare function settleSingleSelection(): void;
/**
 * Drops the selection, whatever shape it is in, and puts the page back in its
 * place — which is what the panels read when nothing is chosen.
 *
 * The page may already be the active element, as it is after Ctrl/Cmd + A:
 * valtio does not report a write that changes nothing, so nothing watching
 * dActiveElement hears about this. Emptying dSelectWidgets is what the drawn
 * selection is taken down by.
 */
export declare function clearSelection(): void;
