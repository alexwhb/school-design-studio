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
  // The toolbar's icon fonts, served from public/ rather than a CDN. They are
  // in the critical path — when that CDN was unreachable every button in the
  // app rendered as a blank square. Refresh with `npm run fetch-iconfont`.
  ICONFONT_URL: 'iconfont/iconfont.css',
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
