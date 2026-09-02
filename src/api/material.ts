/*
 * @Author: ShawnPhang <https://m.palxp.cn>
 * @Date: 2021-08-27 14:42:15
 * @LastEditors: Jeremy Yu <https://github.com/JeremyYu-cn>
 * @LastEditTime: 2024-09-25 00:39:00
 */
import fetch from '@/utils/axios'
import _config from '@/config'
import { IGetTempListData } from './home'

export const getKinds = (params: Type.Object = {}) => fetch('design/cate', params)

type TGetListParam = {
  first_id?: number
  second_id?: string
  cate?: string | number
  pageSize?: number
}

export type TGetListData = {
  category: number
  created_time: string
  height: number
  id: number
  model: string
  original: string
  state: number
  thumb: string
  title: string
  type: string
  updated_time: string
  url: string
  width: number
  thumbUrl: string
  imgUrl: string
}

export type TGetListResult = TPageRequestResult<TGetListData[]>

export const getList = (params: TGetListParam) => fetch<TGetListResult>('design/material', params)

export type TGetFontParam = {
  pageSize?: number
}

export type TGetFontItemData = {
  id: number
  alias: string
  oid: string
  value: string
  preview: string
  woff: string
  lang: string
}

export const getFonts = (params: TGetFontParam = {}) => fetch<TPageRequestResult<TGetFontItemData[]>>('design/fonts', params)

type TGetFontSubParam = {
  font_id: string | number
  id: string | number
  content: string
}

type TGetFontSubExtra = {
  responseType?: string
}

export const getFontSub = (params: TGetFontSubParam, extra: TGetFontSubExtra = {}) => fetch<Blob | string>('design/font_sub', params, 'get', {}, extra)

type TGetImageListParams = {
  page?: number
  pageSize?: number
  cate?: number
  /** Free-text search. Omit it to browse the category given by `cate`. */
  keyword?: string
}

export type TGetImageListResult = {
  created_time: string
  height: number
  width: number
  url: string
  user_id: number
  id: string
  thumb?: string
  /** Average colour, painted while the thumbnail loads. */
  color?: string
  description?: string
  author?: string
  /** Photographer's profile, for the attribution Unsplash asks apps to show. */
  authorUrl?: string
  photoUrl?: string
  /** Opaque Unsplash endpoint; hand it back to `trackImageUse` when placed. */
  downloadLocation?: string
} & Partial<IGetTempListData>

/**
 * Why a photo list came back empty, when it is worth telling the user rather
 * than showing a bare "no results".
 */
export type TImageListError = 'unsplash_key_missing' | 'unsplash_key_invalid' | 'unsplash_rate_limited' | 'unsplash_unavailable'

export type TGetImageListResponse = TPageRequestResult<TGetImageListResult[]> & {
  error?: TImageListError
  provider?: 'unsplash' | 'bundled'
}

export const getImagesList = (params: TGetImageListParams) => fetch<TGetImageListResponse>('design/imgs', params, 'get')

/**
 * Unsplash's API terms require an app to report when a photo is actually used,
 * which is how the photographer's download count is credited. Fire-and-forget:
 * the server holds the key, and a failure here must not block a placement.
 *
 * Placing a photo raises mousedown *and* click, which are one gesture and one
 * use, so a repeat of the same photo inside a moment is dropped.
 */
const recentlyTracked = new Map<string, number>()
const TRACK_DEDUPE_MS = 3000

export const trackImageUse = (downloadLocation?: string) => {
  if (!downloadLocation) return
  const now = Date.now()
  if (now - (recentlyTracked.get(downloadLocation) ?? 0) < TRACK_DEDUPE_MS) return
  recentlyTracked.set(downloadLocation, now)
  fetch('design/imgs/download', { location: downloadLocation, _noLoading: true }, 'get').catch(() => {})
}

type TMyPhotoParams = {
  
  page: number
  pageSize?: number
}

export type TMyPhotoResult = {
  created_time: string
  height: number
  id: number
  url: string
  user_id: number
  width: number
} & IGetTempListData

export const getMyPhoto = (params: TMyPhotoParams) => fetch<TPageRequestResult<TMyPhotoResult[]>>('design/user/image', params)

type TDeleteMyPhotoParams = {
  id: string | number
  key: string
}

export const deleteMyPhoto = (params: TDeleteMyPhotoParams) => fetch<void>('design/user/image/del', params, 'post')

type TDeleteMyWorksParams = {
  id: string | number
}

export const deleteMyWorks = (params: TDeleteMyWorksParams) => fetch<void>('design/poster/del', params, 'post')

type TAddMyPhotoParam = {
  width: number
  height: number
  url: string
}

export const addMyPhoto = (params: TAddMyPhotoParam) => fetch<void>('design/user/add_image', params)

export const upload = ({ file, folder = 'user' }: any, cb: Function) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('folder', folder)
  const extra = {
    responseType: 'application/json',
    onUploadProgress: (progress: any) => {
      cb(Math.floor((progress.loaded / progress.total) * 100), 0)
    },
    onDownloadProgress: (progress: any) => {
      cb(100, Math.floor((progress.loaded / progress.total) * 100))
    },
  }
  return fetch(`${_config.SCREEN_URL}/api/file/upload`, formData, 'post', {}, extra)
}