import type { TPageTransition } from '../../common/animations/transitions';
/** Sets the current page's transition. Null takes it off rather than leaving a `none` behind. */
export declare function setPageTransition(transition: TPageTransition | null): void;
/**
 * Gives every page the current page's transition. One undo step: a deck
 * re-timed by mistake goes back with one press.
 */
export declare function applyTransitionToAllPages(): number;
/** Sets the current page's notes. Blank takes the field off the page. */
export declare function setPageNotes(notes: string): void;
