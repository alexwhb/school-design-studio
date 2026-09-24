/**
 * The lines the Graphics panel offers ready-made: a plain rule, an arrow, and
 * the few variations people reach for most.
 *
 * Each is the same open path the line tool draws — with its ends and its dash
 * already set, so what arrives is styled the same way a hand-drawn line would
 * be after a visit to the panel, and can be taken apart in the same panel.
 *
 * A preset is not a shape, it is a way of arming the line tool: clicking one
 * arms the tool carrying it, and the line is then drawn between two points on
 * the page like any other. Which is why the preset is carried through the
 * control store as a name — `applyLinePreset` is what turns that name back into
 * a styled path once the two points are known.
 */
import type { TdWidgetData } from '../../../../store/types';
import { type TLineEnd } from './lineEnds';
export type TLinePreset = {
    name: string;
    start?: TLineEnd;
    end?: TLineEnd;
    style?: 'solid' | 'dashed' | 'dotted';
    width?: number;
};
export declare const LINE_PRESETS: TLinePreset[];
/** The preset of that name, or null for a line that was armed without one. */
export declare function findLinePreset(name: string | null | undefined): TLinePreset | null;
/** What the preset says about a line, put onto a path setting that has none of it yet. */
export declare function applyLinePreset(setting: Record<string, any>, preset: TLinePreset): void;
/**
 * A preset laid level across the middle of a page this size. What the panel's
 * thumbnails are drawn from; a preset chosen to draw with is fitted to the two
 * points it was drawn between instead, in `DrawLine`.
 */
export declare function linePresetSetting(preset: TLinePreset, page: {
    width: number;
    height: number;
}): TdWidgetData;
