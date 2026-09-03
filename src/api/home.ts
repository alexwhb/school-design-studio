/*
 * @Author: ShawnPhang
 * @Date: 2021-08-19 18:43:22
 * @Description:
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-16 15:37:54
 */
import type { TTemplateBrand } from '@/common/methods/brandKit'
import fetch from '@/utils/axios'

type IGetTempListParam = {
  search: string
  page: number
  pageSize: number
  /** A category slug, or '' for every template. */
  cate: number | string
}
export type IGetTempListData = {
  cover: string
  height: number
  id: number
  state: number
  title: string
  width: number
  isDelect: boolean
  fail: boolean
  top: number
  left: number
  data?: string
  listWidth?: number
  gap?: number
  thumb?: string
  url: string
  model?: string
  color?: string
  /** Only on the inline `data` path; see `TTempDetail.brand`. */
  brand?: TTemplateBrand
}
type IGetTempListResult = TPageRequestResult<IGetTempListData[]>

export const getTempList = (params: IGetTempListParam) => fetch<IGetTempListResult>('design/list', params, 'get')

export type TGetTempDetail = {
  id: number
  type?: number
}

export type TTempDetail = {
  category: number
  cover: string
  created_time: string
  data: string
  height: number
  id: number
  original: string
  resource: string
  state: string
  tag: string | null
  title: string
  updated_time: string
  width: number
  /**
   * Which of the template's own colours play which brand role, and whether it
   * would rather keep its palette. Absent on anything made before templates
   * said, and on every saved design, which is why nothing may require it.
   */
  brand?: TTemplateBrand
}

export const getTempDetail = (params: TGetTempDetail) => fetch<TTempDetail>('design/temp', params, 'get')

type TGetCategoriesParams = {
  type?: number
}
/**
 * A template category — one chip above the Templates panel. `id` is the slug
 * carried by each record in `templates/list.json`; the server only answers
 * with categories that have something filed under them.
 */
export type TGetCategoriesData = {
  id: string
  name: string
}

export const getCategories = (params: TGetCategoriesParams = {}) => fetch<TGetCategoriesData[]>('design/cate', params, 'get')

// Save template
export const saveTemp = (params: Type.Object = {}) => fetch('design/edit', params, 'post')
// export const delTemp = (params: Type.Object = {}) => fetch('/api/template/temp_del', params)

type TGetCompListParam = {
  search?: string
  page?: number
  type?: number
  pageSize?: number
  cate?: number | string
}

export type TGetCompListResult = {
  cover: string
  height: number
  id: number
  state: number
  title: string
  width: number
  name?: string
  cate?: string
}

type getCompListReturn = TPageRequestResult<TGetCompListResult[]>

export const getCompList = (params: TGetCompListParam) => fetch<getCompListReturn>('design/list', params, 'get')

type TRemoveComp = {
  id: string | number
}

export const removeComp = (params: TRemoveComp) => fetch<void>('design/del', params, 'post')
// export const getCompDetail = (params: Type.Object = {}) => fetch('/api/template/temp_info', params, 'get')

type TSaveWorksParams = {
  title: string
  temp_id?: string
  width: number
  height: number
  data: string
  cover?: string
  id?: string | number
}

export type TSaveWorksResult = {
  id: number | string
  stat?: number
  msg: string
}

export const saveWorks = (params: TSaveWorksParams) => fetch<TSaveWorksResult>('design/save', params, 'post')

export const saveMyTemp = (params: Type.Object = {}) => fetch('design/user/temp', params, 'post')

export const getWorks = (params: TGetTempDetail) => fetch<TTempDetail>('design/poster', params, 'get')

type TGetMyDesignParams = {
  page: number
  pageSize: number
}

type TGetMyDesignResult = TPageRequestResult<IGetTempListData[]>

export const getMyDesign = (params: TGetMyDesignParams) => fetch<TGetMyDesignResult>('design/my', params, 'get')
