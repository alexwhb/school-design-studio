import { type TShapeSetting } from '../shape/shapeSetting';
export type TWPolygonSetting = TShapeSetting & {
    /** How many corners, from three to a hundred. See polygonShape.ts. */
    sides: number;
};
/**
 * A triangle, because it is the shape people reach for the tool to draw and the
 * one that makes plainest what the corner count does when it is turned up. It
 * starts square, like the other two, so a click of any tool puts down something
 * the same size.
 */
export declare const wPolygonSetting: TWPolygonSetting;
