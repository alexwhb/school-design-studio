import { shapeSetting, type TShapeSetting } from '../shape/shapeSetting'

export type TWEllipseSetting = TShapeSetting

/**
 * An ellipse has no corners to round, so it is a shape and nothing more. It
 * starts square, which makes the default one a circle — the same size the box
 * tool drops, so a click of either tool puts down something the same size.
 */
export const wEllipseSetting: TWEllipseSetting = shapeSetting('Ellipse', 'w-ellipse')
