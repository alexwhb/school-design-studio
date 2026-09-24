import type { TdWidgetData } from '../types';
type TAlign = 'left' | 'ch' | 'right' | 'top' | 'cv' | 'bottom';
type TDistribute = 'horizontal' | 'vertical';
export type TUpdateAlignData = {
    align: TAlign;
    uuid: string;
    group?: TdWidgetData;
};
export type TDistributeGeometryData = {
    distribute: TDistribute;
    uuids: string[];
};
export declare function updateAlign({ align, uuid, group }: TUpdateAlignData): void;
/**
 * Spaces the given widgets evenly along one axis, the way XD and Figma do it:
 * the outermost two stay exactly where they are and everything between them is
 * slid over until every gap is the same. Two widgets are already evenly spaced
 * by definition, so there is nothing to even out below three.
 *
 * Sizes come from the rendered box where there is one — a text box is as wide
 * as the browser drew it, not as wide as the store asked for, and spacing the
 * store's numbers would leave visible gaps that disagree.
 */
export declare function distributeGeometry({ distribute, uuids }: TDistributeGeometryData): void;
export {};
