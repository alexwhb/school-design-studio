import { type ResizeStrategyId } from '../../common/methods/resize/strategies';
export type TResizeScope = 'page' | 'all';
export type TResizePagesPayload = {
    width: number;
    height: number;
    /** Which of common/methods/resize/strategies.ts to lay the artwork out with. */
    strategy: ResizeStrategyId;
    /** Just the page on screen, or every page in the design. */
    scope: TResizeScope;
};
export declare function resizePages(payload: TResizePagesPayload): void;
