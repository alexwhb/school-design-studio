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
  API_URL: isDev ? 'http://localhost:7001' : '', // Backend address
  SCREEN_URL: isDev ? 'http://localhost:7001' : '', // Screenshot service address
  IMG_URL: 'https://store.palxp.cn/', // Asset host
  // ICONFONT_URL: '//at.alicdn.com/t/font_3223711_74mlzj4jdue.css',
  ICONFONT_URL: '//at.alicdn.com/t/font_2717063_ypy8vprc3b.css?display=swap',
  ICONFONT_EXTRA: '//at.alicdn.com/t/c/font_3228074_xojoer6zhp.css',
  QINIUYUN_PLUGIN: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/qiniu-js/2.5.5/qiniu.min.js',
  supportSubFont: false, // Enable server-side font subsetting
}

export const LocalStorageKey = {
  tokenKey: "xp_token"
}
