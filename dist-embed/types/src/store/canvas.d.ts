import type { TGuidelinesData, TPageState, TScreeData } from './types';
export declare function updateZoom(zoom: number): void;
export declare function updatePaddingTop(num: number): void;
export declare function updateScreen({ width, height }: TScreeData): void;
export declare function updateGuidelines(lines: Partial<TGuidelinesData>): void;
export declare function reChangeCanvas(): void;
export declare function updatePageData<T extends keyof TPageState>({ key, value }: {
    key: T;
    value: TPageState[T];
}): void;
export declare function getDPage(): TPageState;
export declare function setDPage(data: TPageState): void;
export declare function updateDPage(): void;
export declare function setBottomHeight(h: number): void;
export declare function setDCurrentPage(n: number): void;
