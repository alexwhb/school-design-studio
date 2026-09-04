/**
 * What a path drawn with the pen starts out as.
 *
 * Two shapes come out of the one tool, and which one you get is decided by
 * where you stop drawing — the same as it is in Adobe XD. Run the path back to
 * the point you started from and it is a closed shape, so it arrives filled in
 * the placeholder grey every drawn shape arrives in, with no outline. Stop
 * anywhere else and it is a line, so it arrives with an outline to be a line
 * with and nothing inside it.
 *
 * Both are the same widget, and both keep both settings: a closed shape can be
 * given an outline, an open one can be filled — SVG closes an open path off
 * with a straight run to fill it, which is what XD shows too — and the panel's
 * own toggle moves a path between the two without touching either.
 */
import { type TShapeSetting } from '../shape/shapeSetting';
import type { TPathPoint } from './pathGeometry';
export type TWPathSetting = TShapeSetting & {
    /** Fractions of the frame; see pathGeometry.ts, which is the only thing that should read them. */
    points: TPathPoint[];
    closed: boolean;
};
/** What a line is drawn with when nothing has said otherwise, in design pixels. */
export declare const PATH_STROKE_WIDTH = 2;
/** Dark enough to read on a white page, light enough not to read as black ink. */
export declare const PATH_STROKE_COLOR = "#333333ff";
export declare const wPathSetting: TWPathSetting;
/** The same widget as a closed shape: filled like every other drawn shape, and bare. */
export declare function closedPathSetting(): TWPathSetting;
export declare function openPathSetting(): TWPathSetting;
