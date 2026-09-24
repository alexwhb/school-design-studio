import type { TdWidgetData } from '../types';
export type PictureSource = {
    url: string;
    width: number;
    height: number;
};
/** Whether a picture dropped on this layer goes into it rather than beside it. */
export declare function takesPicture(layer: TdWidgetData | null | undefined): boolean;
/**
 * The layer with the new picture in it. Pure: the layer given is not touched,
 * and what comes back keeps its uuid, so a host holding the id still has it.
 */
export declare function withPicture(layer: TdWidgetData, picture: PictureSource): TdWidgetData;
/**
 * Puts `picture` into the layer `uuid` on the page on screen, as one step of
 * undo, and selects it. False when there is no such layer or it does not take
 * pictures, so the caller can place the picture the ordinary way instead.
 */
export declare function fillPicture(uuid: string, picture: PictureSource): boolean;
/**
 * The layer under a pointer that a dropped picture would go into, by uuid, or
 * null. The nearest widget wins, so a photo inside a group is found rather
 * than the group around it.
 */
export declare function pictureTargetOf(element: Element | null | undefined): string | null;
