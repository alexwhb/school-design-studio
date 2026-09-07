export type TInitResize = {
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    width: number;
    height: number;
};
export type TSize = {
    width: number;
    height: number;
};
export type TdResizePayload = {
    x: number;
    y: number;
    dirs: 'top' | 'left' | 'bottom' | 'right';
};
export declare function initDResize(payload: TInitResize): void;
export declare function dResize({ x, y, dirs }: TdResizePayload): void;
export declare function resize(size: TSize): null | undefined;
export declare function autoResizeAll(lastPageSize: TSize): void;
