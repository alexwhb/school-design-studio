const prefix: Record<string, string | undefined> = typeof process !== 'undefined' && process.env ? process.env : {}

const isDev = prefix.NODE_ENV === 'development'
import { version } from '../../package.json'

const config = {
  isDev,
  BASE_URL: isDev ? '/' : './',
  VERSION: version,
  APP_NAME: 'Design Studio',
  HOME_URL: '/',
  COPYRIGHT: 'Based on poster-design by ShawnPhang (MIT)',
  API_URL: prefix.DESIGN_API_URL || '',
  SCREEN_URL: isDev ? 'http://localhost:7001' : '',
  IMG_URL: 'https://store.palxp.cn/',
  ICONFONT_URL: '//at.alicdn.com/t/font_2717063_ypy8vprc3b.css?display=swap',
  ICONFONT_EXTRA: '//at.alicdn.com/t/c/font_3228074_xojoer6zhp.css',
  QINIUYUN_PLUGIN: 'https://lf26-cdn-tos.bytecdntp.com/cdn/expire-1-M/qiniu-js/2.5.5/qiniu.min.js',
  supportSubFont: false,
}

export type DesignStudioConfig = Partial<typeof config>

/** Lets a host app point the editor at its own backend and home page. */
export function configure(overrides: DesignStudioConfig) {
  Object.assign(config, overrides)
}

export default config

export const LocalStorageKey = {
  tokenKey: 'xp_token',
}
