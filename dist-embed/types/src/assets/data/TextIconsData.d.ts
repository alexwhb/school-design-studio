import type { ComponentType } from 'react';
import { AlignListData } from './AlignListData';
export type TStyleIconData = {
    key: string;
    icon: string;
    tip: string;
    value: string[];
    select: boolean;
    extraIcon?: boolean;
};
export declare const styleIconList1: TStyleIconData[];
export type TStyleIconData2 = {
    key: string;
    /** A glyph from the icon font, or `Icon` when the font has none. */
    icon?: string;
    Icon?: ComponentType<{
        className?: string;
    }>;
    tip: string;
    value: string;
    select: boolean;
};
export declare const styleIconList2: TStyleIconData2[];
export declare const alignIconList: AlignListData[];
