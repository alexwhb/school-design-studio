import { IGetTempListData } from './home';
export declare const getKinds: (params?: Type.Object) => Promise<any>;
type TGetListParam = {
    first_id?: number;
    second_id?: string;
    cate?: string | number;
    pageSize?: number;
};
export type TGetListData = {
    category: number;
    created_time: string;
    height: number;
    id: number;
    model: string;
    original: string;
    state: number;
    thumb: string;
    title: string;
    type: string;
    updated_time: string;
    url: string;
    width: number;
    thumbUrl: string;
    imgUrl: string;
};
export type TGetListResult = TPageRequestResult<TGetListData[]>;
export declare const getList: (params: TGetListParam) => Promise<TGetListResult>;
export type TGetFontParam = {
    pageSize?: number;
};
export type TGetFontItemData = {
    id: number;
    alias: string;
    oid: string;
    value: string;
    preview: string;
    woff: string;
    lang: string;
};
export declare const getFonts: (params?: TGetFontParam) => Promise<TPageRequestResult<TGetFontItemData[]>>;
type TGetFontSubParam = {
    font_id: string | number;
    id: string | number;
    content: string;
};
type TGetFontSubExtra = {
    responseType?: string;
};
export declare const getFontSub: (params: TGetFontSubParam, extra?: TGetFontSubExtra) => Promise<string | Blob>;
type TGetImageListParams = {
    page?: number;
    pageSize?: number;
    cate?: number;
    /** Free-text search. Omit it to browse the category given by `cate`. */
    keyword?: string;
};
export type TGetImageListResult = {
    created_time: string;
    height: number;
    width: number;
    url: string;
    user_id: number;
    id: string;
    thumb?: string;
    /** Average colour, painted while the thumbnail loads. */
    color?: string;
    description?: string;
    author?: string;
    /** Photographer's profile, for the attribution Unsplash asks apps to show. */
    authorUrl?: string;
    photoUrl?: string;
    /** Opaque Unsplash endpoint; hand it back to `trackImageUse` when placed. */
    downloadLocation?: string;
} & Partial<IGetTempListData>;
/**
 * Why a photo list came back empty, when it is worth telling the user rather
 * than showing a bare "no results".
 */
export type TImageListError = 'unsplash_key_missing' | 'unsplash_key_invalid' | 'unsplash_rate_limited' | 'unsplash_unavailable';
export type TGetImageListResponse = TPageRequestResult<TGetImageListResult[]> & {
    error?: TImageListError;
    provider?: 'unsplash' | 'bundled';
};
export declare const getImagesList: (params: TGetImageListParams) => Promise<TGetImageListResponse>;
export declare const trackImageUse: (downloadLocation?: string) => void;
type TMyPhotoParams = {
    page: number;
    pageSize?: number;
};
export type TMyPhotoResult = {
    created_time: string;
    height: number;
    id: number;
    url: string;
    user_id: number;
    width: number;
} & IGetTempListData;
export declare const getMyPhoto: (params: TMyPhotoParams) => Promise<TPageRequestResult<TMyPhotoResult[]>>;
type TDeleteMyPhotoParams = {
    id: string | number;
    key: string;
};
export declare const deleteMyPhoto: (params: TDeleteMyPhotoParams) => Promise<void>;
type TDeleteMyWorksParams = {
    id: string | number;
};
export declare const deleteMyWorks: (params: TDeleteMyWorksParams) => Promise<void>;
type TAddMyPhotoParam = {
    width: number;
    height: number;
    url: string;
};
export declare const addMyPhoto: (params: TAddMyPhotoParam) => Promise<void>;
export declare const upload: ({ file, folder }: any, cb: Function) => Promise<any>;
export {};
