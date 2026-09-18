import { type TBrandKit } from '../common/methods/brandKitCore';
import type { DesignDocument } from './types';
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
