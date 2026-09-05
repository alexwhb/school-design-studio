import type { TBaseState, TCanvasState, TControlState, TForceState, TGroupState, THistoryState, TUserState, TWidgetState } from './types';
export declare const canvasState: TCanvasState;
export declare const widgetState: TWidgetState;
/** Remembers the snapping toggle between sessions, like the theme does. */
export declare const SNAP_STORAGE_KEY = "ds_snap";
/** The grid, remembered the same way — both whether it is on and how fine it is. */
export declare const GRID_STORAGE_KEY = "ds_grid";
export declare const GRID_SIZE_STORAGE_KEY = "ds_grid_size";
/**
 * The spacings offered. Three is enough: a coarse one to lay a page out on, a
 * middling default, and a fine one for lining up small things. Anything the
 * store is handed that is not on this list is ignored, so a stored value from a
 * future build cannot leave someone with a grid they have no way to change.
 */
export declare const GRID_SIZES: number[];
export declare const controlState: TControlState;
export declare const forceState: TForceState;
export declare const historyState: THistoryState;
export declare const baseState: TBaseState;
export declare const userState: TUserState;
export declare const groupState: TGroupState;
