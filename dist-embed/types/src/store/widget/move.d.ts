import type { TdWidgetData } from '../types';
export type TInidDMovePayload = {
    startX: number;
    startY: number;
    originX: number;
    originY: number;
};
export type TMovePayload = {
    donotMove?: boolean;
    x: number;
    y: number;
};
export declare function initDMove(payload: TInidDMovePayload): void;
export declare function dMove(payload: TMovePayload): void;
export declare function updateGroupSize(uuid: string): void;
export declare function updateHoverUuid(uuid: string): void;
export declare function setDropOver(uuid: string): void;
export declare function setdActiveElement(data: TdWidgetData): void;
