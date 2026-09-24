import type { TdWidgetData } from '../../../store/types';
export type PptxAlt = {
    text: string;
    decorative: boolean;
};
/**
 * What a picture on a slide should say. A text box that had to be drawn as a
 * picture, because PowerPoint cannot draw its effect, says its own words.
 */
export declare function pptxAltFor(widget: TdWidgetData): PptxAlt;
/**
 * One slide's XML, with its pictures' descriptions put right. `alts` is keyed
 * by the `objectName` each picture was given. A picture not in it, which is a
 * page background, is decoration.
 */
export declare function applySlideAlt(xml: string, alts: ReadonlyMap<string, PptxAlt>): string;
