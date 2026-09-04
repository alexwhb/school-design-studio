/**
 * What a shape drawn on the page starts out as.
 *
 * A rectangle and an ellipse are the same widget in everything but outline:
 * the same fill, the same border, the same shadow, the same smallest size the
 * tool will draw. Only the corners differ, so only the corners are left to the
 * widget that has them.
 */
import type { TWidgetShadow } from '../../../../common/methods/shadow';
export type TShapeSetting = {
    name: string;
    type: string;
    uuid: string;
    left: number;
    top: number;
    width: number;
    height: number;
    /** Solid or gradient, whatever the colour picker was left on. */
    color: string;
    opacity: number;
    borderWidth: number;
    borderColor: string;
    borderStyle: string;
    transform: string;
    parent: string;
    record: {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        dir: string;
    };
    rotate?: string;
    shadow?: TWidgetShadow;
};
/**
 * A light grey, which is what Adobe XD drops too: obviously a placeholder, and
 * visible on a white page and a dark one without claiming to be a choice.
 */
export declare const SHAPE_DEFAULT_FILL = "#d8d8d8ff";
/** What a click with no drag behind it produces, in design pixels. */
export declare const SHAPE_DEFAULT_SIZE = 200;
/**
 * The smallest shape the tools will draw. Under this a drag is a slip of the
 * hand on the way to a click, not a shape two pixels wide that nobody can
 * select.
 */
export declare const SHAPE_MIN_SIZE = 4;
/** A fresh shape of the given kind, at the default size and in the default grey. */
export declare function shapeSetting(name: string, type: string): TShapeSetting;
