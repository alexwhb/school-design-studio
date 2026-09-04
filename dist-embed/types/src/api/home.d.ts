import type { TTemplateBrand } from '../common/methods/brandKit';
type IGetTempListParam = {
    search: string;
    page: number;
    pageSize: number;
    /** A category slug, or '' for every template. */
    cate: number | string;
};
export type IGetTempListData = {
    cover: string;
    height: number;
    id: number;
    state: number;
    title: string;
    width: number;
    isDelect: boolean;
    fail: boolean;
    top: number;
    left: number;
    data?: string;
    listWidth?: number;
    gap?: number;
    thumb?: string;
    url: string;
    model?: string;
    color?: string;
    /** Which chip it is filed under — 'poster', 'slide', 'award' and so on. */
    cate?: string;
    /** Only on the inline `data` path; see `TTempDetail.brand`. */
    brand?: TTemplateBrand;
};
type IGetTempListResult = TPageRequestResult<IGetTempListData[]>;
export declare const getTempList: (params: IGetTempListParam) => Promise<IGetTempListResult>;
export type TGetTempDetail = {
    id: number;
    type?: number;
};
export type TTempDetail = {
    category: number;
    cover: string;
    created_time: string;
    data: string;
    height: number;
    id: number;
    original: string;
    resource: string;
    state: string;
    tag: string | null;
    title: string;
    updated_time: string;
    width: number;
    /**
     * Which of the template's own colours play which brand role, and whether it
     * would rather keep its palette. Absent on anything made before templates
     * said, and on every saved design, which is why nothing may require it.
     */
    brand?: TTemplateBrand;
};
export declare const getTempDetail: (params: TGetTempDetail) => Promise<TTempDetail>;
type TGetCategoriesParams = {
    type?: number;
};
/**
 * A template category — one chip above the Templates panel. `id` is the slug
 * carried by each record in `templates/list.json`; the server only answers
 * with categories that have something filed under them.
 */
export type TGetCategoriesData = {
    id: string;
    name: string;
};
export declare const getCategories: (params?: TGetCategoriesParams) => Promise<TGetCategoriesData[]>;
export declare const saveTemp: (params?: Type.Object) => Promise<any>;
type TGetCompListParam = {
    search?: string;
    page?: number;
    type?: number;
    pageSize?: number;
    cate?: number | string;
};
export type TGetCompListResult = {
    cover: string;
    height: number;
    id: number;
    state: number;
    title: string;
    width: number;
    name?: string;
    cate?: string;
};
type getCompListReturn = TPageRequestResult<TGetCompListResult[]>;
export declare const getCompList: (params: TGetCompListParam) => Promise<getCompListReturn>;
type TRemoveComp = {
    id: string | number;
};
export declare const removeComp: (params: TRemoveComp) => Promise<void>;
type TSaveWorksParams = {
    title: string;
    temp_id?: string;
    width: number;
    height: number;
    data: string;
    cover?: string;
    id?: string | number;
};
export type TSaveWorksResult = {
    id: number | string;
    stat?: number;
    msg: string;
};
export declare const saveWorks: (params: TSaveWorksParams) => Promise<TSaveWorksResult>;
export declare const saveMyTemp: (params?: Type.Object) => Promise<any>;
export declare const getWorks: (params: TGetTempDetail) => Promise<TTempDetail>;
type TGetMyDesignParams = {
    page: number;
    pageSize: number;
};
type TGetMyDesignResult = TPageRequestResult<IGetTempListData[]>;
export declare const getMyDesign: (params: TGetMyDesignParams) => Promise<TGetMyDesignResult>;
export {};
