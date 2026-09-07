import type { TBrandKit } from '../../common/methods/brandKit';
import { type TApplyBrandOptions, type TApplyBrandOutcome } from './brandCore';
export * from './brandCore';
/**
 * Paints whatever is selected in one brand colour: the words of a text box,
 * the fill of a shape, the first colour of a piece of line art, or the page
 * itself when nothing is selected. A group takes it on every member; a
 * marquee selection takes it on each thing in it. Returns how many things
 * changed, so the caller can say when the answer is none — a photograph,
 * say, which has no colour of its own to change.
 */
export declare function applyBrandColorToSelection(color: string): number;
/**
 * Puts a `{{school.*}}` field where it will be read: on the end of the text
 * box that is selected, or into a new text box in the middle of the page when
 * none is. Says which it did.
 */
export declare function insertBrandField(field: string): 'appended' | 'added';
/**
 * Puts the logo on the page as a picture, a fifth of the page wide — big
 * enough to read on a poster, small enough to sit in a corner of a slide —
 * and no bigger than the file itself, so a small crest is not blown up soft.
 */
export declare function insertBrandLogo(logo: NonNullable<TBrandKit['logo']>): void;
/**
 * Apply brand, over the design the editor has open.
 *
 * The work is `applyBrandToLayouts`; what this adds is the one thing the core
 * cannot know, which design that is. It writes through the store's own arrays,
 * so the page on screen moves with the rest.
 */
export declare function applyBrandToDesign(kit: TBrandKit, options: TApplyBrandOptions): TApplyBrandOutcome;
