import { type TBrandKit } from '../common/methods/brandKitCore';
import type { DesignDocument } from './types';
import type { Theme } from './themes';
/**
 * The theme with the kit's fonts in it, for setting type before it is measured.
 *
 * Apply brand swaps the fonts on a finished page, and on a composed one that is
 * too late: every line has already been measured and broken in the theme's
 * face. Anton to Libre Baskerville is a third wider again, so a heading that
 * fitted on two lines in one came out on three in the other, over whatever was
 * under it. So the composer asks here first and lays the words out in the font
 * they will be read in. The pass at the end then finds every box already in
 * the right face and leaves it be.
 *
 * Same choice as Apply brand, from the same function: headings take the kit's
 * heading font, body text its body font, each falling back to the other. The
 * eyebrow face is not touched, because the boxes set in it say `keep`.
 */
export declare function brandTheme(theme: Theme, brand?: TBrandKit): Theme;
/**
 * What a line carrying `{{school.*}}` will actually read once the kit fills it.
 *
 * Needed *before* the line is measured, not after. A footer laid out around
 * `{{school.name}}` and then filled with "Riverbend Academy Middle School" is a
 * footer that fits in the composer's arithmetic and runs off the page in print.
 * With no kit the field is left standing, which is what an author should see.
 */
export declare function fieldFiller(brand?: TBrandKit): (text: string) => string;
export declare function applyBrand(doc: DesignDocument, brand: TBrandKit): DesignDocument;
