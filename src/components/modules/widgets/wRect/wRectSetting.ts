import { shapeSetting, type TShapeSetting } from '../shape/shapeSetting'
import type { TCorners } from './rectRadius'

export type TWRectSetting = TShapeSetting & {
  /** Every corner, unless `radii` says otherwise. See rectRadius.ts. */
  radius: number
  radii?: TCorners
}

export const wRectSetting: TWRectSetting = {
  ...shapeSetting('Rectangle', 'w-rect'),
  radius: 0,
}
