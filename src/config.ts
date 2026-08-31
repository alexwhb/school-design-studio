/*
 * @Author: ShawnPhang
 * @Date: 2024-04-05 07:31:45
 * @Description:  
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 05:30:15
 */
// const prefix = import.meta.env
const prefix = process.env

const isDev = prefix.NODE_ENV === 'development'
import { version } from '../package.json'

export default {
  isDev,
  BASE_URL: isDev ? '/' : './',
  VERSION: version,
  APP_NAME: 'Design Studio',
  // Where the app name in the toolbar links back to. Point this at the host
  // app when the editor is embedded in one.
  HOME_URL: '/',
  COPYRIGHT: 'Based on poster-design by ShawnPhang (MIT)',
  // Same-origin by default: `npm run dev` and serve.mjs both answer the
  // read-only /design/* lookups themselves. Set DESIGN_API_URL to point at the
  // real service/ backend instead (needed for saving designs).
  API_URL: prefix.DESIGN_API_URL || '', // Backend address
  SCREEN_URL: isDev ? 'http://localhost:7001' : '', // Screenshot service address
  // The toolbar's icon fonts, served from public/ rather than a CDN. They are
  // in the critical path — when that CDN was unreachable every button in the
  // app rendered as a blank square. Refresh with `npm run fetch-iconfont`.
  ICONFONT_URL: 'iconfont/iconfont.css',
  supportSubFont: false, // Enable server-side font subsetting
}

export const LocalStorageKey = {
  tokenKey: "xp_token"
}
