import { shapeSetting, type TShapeSetting } from '../shape/shapeSetting'
import { MIN_SIDES } from './polygonShape'

export type TWPolygonSetting = TShapeSetting & {
  /** How many corners, from three to a hundred. See polygonShape.ts. */
  sides: number
}

/**
 * A triangle, because it is the shape people reach for the tool to draw and the
 * one that makes plainest what the corner count does when it is turned up. It
 * starts square, like the other two, so a click of any tool puts down something
 * the same size.
 */
export const wPolygonSetting: TWPolygonSetting = {
  ...shapeSetting('Polygon', 'w-polygon'),
  sides: MIN_SIDES,
}
