import type { TWidgetShadow } from '@/common/methods/shadow'
import type { TCorners } from './rectRadius'

export type TWRectSetting = {
  name: string
  type: string
  uuid: string
  left: number
  top: number
  width: number
  height: number
  /** Solid or gradient, whatever the colour picker was left on. */
  color: string
  /** Every corner, unless `radii` says otherwise. See rectRadius.ts. */
  radius: number
  radii?: TCorners
  opacity: number
  borderWidth: number
  borderColor: string
  borderStyle: string
  transform: string
  parent: string
  record: {
    width: number
    height: number
    minWidth: number
    minHeight: number
    dir: string
  }
  rotate?: string
  shadow?: TWidgetShadow
}

/**
 * A light grey, which is what Adobe XD drops too: obviously a placeholder, and
 * visible on a white page and a dark one without claiming to be a choice.
 */
export const RECT_DEFAULT_FILL = '#d8d8d8ff'

/** What a click with no drag behind it produces, in design pixels. */
export const RECT_DEFAULT_SIZE = 200

/**
 * The smallest box the tool will draw. Under this a drag is a slip of the hand
 * on the way to a click, not a box two pixels wide that nobody can select.
 */
export const RECT_MIN_SIZE = 4

export const wRectSetting: TWRectSetting = {
  name: 'Rectangle',
  type: 'w-rect',
  uuid: '-1',
  left: 0,
  top: 0,
  width: RECT_DEFAULT_SIZE,
  height: RECT_DEFAULT_SIZE,
  color: RECT_DEFAULT_FILL,
  radius: 0,
  opacity: 1,
  borderWidth: 0,
  borderColor: '#000000ff',
  borderStyle: 'solid',
  transform: '',
  parent: '-1',
  record: {
    width: 0,
    height: 0,
    minWidth: RECT_MIN_SIZE,
    minHeight: RECT_MIN_SIZE,
    dir: 'all',
  },
}
