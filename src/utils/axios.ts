/*
 * @Author: ShawnPhang
 * @Date: 2021-07-13 02:48:38
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-03 20:56:23
 */
import axios, { AxiosRequestConfig, AxiosResponse, AxiosStatic } from 'axios'
import app_config, { LocalStorageKey } from '@/config'
import { baseState, userState } from '@/store/state'

axios.defaults.timeout = 30000
// const version = app_config.VERSION;
const baseUrl = () => app_config.API_URL

axios.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    const url = config.url ?? ""
    const values = {}
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      config.url = url.startsWith('/') ? baseUrl() + url : (config.url = baseUrl() + '/' + url)
    }

    if (config.method === 'get') {
      //  config.params = utils.extend(config.params, values)
      config.params = Object.assign(config.params, values)
      // config.params = qs.stringify(config.params);
    } else {
      config.data = Object.assign(config.data, values)
      //  config.data = utils.extend(config.data, values)
      // config.data = qs.stringify(config.data);
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

axios.interceptors.response.use((res: AxiosResponse<any>) => {
    // store.dispatch('hideLoading');
    if (!res.data) {
      return Promise.reject(res)
    }
    // A string body means something other than the API answered — typically a
    // static host returning index.html for an unknown path. Treat it the same
    // as the backend being absent rather than handing HTML to the callers.
    if (typeof res.data === 'string') {
      warnBackendOffline()
      return Promise.resolve(emptyResult())
    }
    if (res.data.code === 401) {
      console.log('Signed out')
      userState.online = false
      // store.commit('changeOnline', false)
    }

    if (res.data.result && res.data.code === 200) {
      return Promise.resolve(res.data.result)
    } else if (res.data.data && res.data.stat == 1) {
      return Promise.resolve(res.data.data)
    } else {
      return Promise.resolve(res.data)
    }
  },
  (error) => {
    setTimeout(() => {
      baseState.loading = false
    }, 600)

    // No `response` means the request never reached a server: the optional
    // content backend is not running. That is a supported way to use the
    // editor — you still get text, shapes, uploads and every export, just no
    // stock template or photo library. Resolving with an empty result lets the
    // panels show an empty state instead of throwing past every caller.
    if (!error?.response) {
      warnBackendOffline()
      return Promise.resolve(emptyResult())
    }

    return Promise.reject(error)
  },
)

/**
 * Satisfies both shapes callers expect: it destructures as `{ list }` and it
 * still has a `length`, so neither style of call site blows up.
 */
function emptyResult() {
  return Object.assign([], { list: [], data: [], records: [], total: 0, stat: 0 })
}

let warnedOffline = false
function warnBackendOffline() {
  if (warnedOffline) return
  warnedOffline = true
  console.info(
    `[Design Studio] No content backend at ${baseUrl() || 'the configured API URL'}. ` +
      'Templates and stock photos are unavailable; everything else works normally.',
  )
}

type TFetchRequestConfigParams = AxiosRequestConfig & Record<string, any>
type TFetchMethod = keyof Pick<
  AxiosStatic, 
  "get" | "post" | "put" | "getUri" | "request" | "delete" | "head" | "options" | "patch"
>

// export default axios;
const fetch = <T = any> (
  url: string,
  params: TFetchRequestConfigParams, 
  type: TFetchMethod = 'get',
  exheaders: Record<string, any> = {},
  extra: Record<string, any> = {}
): Promise<T> => {
  if (params?._noLoading) {
    delete params._noLoading
  }

  // Upstream hardcoded a demo JWT here, so every request went out wearing a
  // stranger's identity. There is no account system in this fork, so normally
  // there is no token and no Authorization header at all. The key is the seam
  // for a host app that does have a session: write it and requests pick it up.
  const token = localStorage.getItem(LocalStorageKey.tokenKey)
  const headerObject: Record<string, any> = {}
  token && (headerObject.Authorization = token)
  
  if (type === 'get') {
    return axios.get(url, {
      headers: Object.assign(headerObject, exheaders),
      params,
      ...extra,
    })
  } else {
    return axios[type](url, params, {
      headers: Object.assign(headerObject, exheaders),
      ...extra,
    }) as Promise<T>
  }
}

export default fetch
