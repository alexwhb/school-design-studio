/**
 * The font list the editor works from.
 *
 * The fonts ship with the app (public/fonts), so unlike the original there is
 * nothing to fetch and nothing to cache — the list is a static import and is
 * always available, including offline. public/fonts/fonts.css declares every
 * face up front, so a font is ready the moment someone picks it.
 */
import { type TFontItem } from '../../../assets/data/FontsData';
export type TFontItemData = TFontItem;
export declare const useFontStore: {
    list: TFontItem[];
    init(): Promise<void>;
};
