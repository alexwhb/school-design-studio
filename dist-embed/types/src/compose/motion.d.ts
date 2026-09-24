import type { DesignDocument } from './types';
/**
 * Turns motion on or off across a whole deck.
 *
 * A poster is returned untouched: it is one page, nobody presents it, and a
 * transition on a sign that gets printed is meaningless.
 *
 * Turning it off is a real erase rather than a no-op, so the toggle works both
 * ways — including over a deck somebody has since edited by hand. That is the
 * intended behaviour and worth knowing: this is a deck-wide setting, not a
 * merge, so switching it off clears entrances the person set themselves.
 */
export declare function applyMotion(doc: DesignDocument, on: boolean): DesignDocument;
/** Whether a deck already has motion on it — what a toggle reads to know its state. */
export declare function hasMotion(doc: DesignDocument): boolean;
