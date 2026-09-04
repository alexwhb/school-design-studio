import { type TTextHit } from '../../utils/widgets/textMatch';
export type TSearchScope = 'all' | 'page';
export type TFindOptions = {
    query: string;
    matchCase: boolean;
    scope: TSearchScope;
};
export type TFindMatch = TTextHit & {
    page: number;
    uuid: string;
    /** Which cell of a table holds it, as [row, column]. Absent for a text box. */
    cell?: [number, number];
    /**
     * Whether the layer holding it is hidden or locked. Both are still searched —
     * hiding is about the canvas and locking is about dragging, neither is about
     * the words — but a count of things the person cannot see on screen is
     * baffling unless it is said out loud.
     */
    unseen: boolean;
};
export type TReplaceOutcome = {
    replaced: number;
    pages: number;
    unseen: number;
};
/** Every occurrence, in reading order: page by page, layer by layer, left to right. */
export declare function findMatches({ query, matchCase, scope }: TFindOptions): TFindMatch[];
/** How many distinct pages a set of matches falls on. */
export declare function pagesTouched(matches: TFindMatch[]): number;
/**
 * Puts a match on screen: the page it is on, and the box that holds it
 * selected, so it can be read in context rather than taken on trust.
 *
 * `showPage` is the only correct way to change page — it keeps the page index,
 * the widget list and the canvas store's copy of the page in step, in that
 * order — and it clears the selection on the way, which is why the box is
 * chosen afterwards rather than before.
 */
export declare function revealMatch(match: TFindMatch): void;
/**
 * Rewrites one occurrence. Not wrapped in history itself — the caller decides
 * how much of a change one undo should take back.
 */
export declare function applyReplace(match: TFindMatch, replacement: string): boolean;
/**
 * Rewrites every occurrence given.
 *
 * Grouped by run of markup — a text box, or one cell of a table — so each is
 * parsed and re-serialised once rather than once per hit, and so the hits inside it are spliced together —
 * `replaceInMarkup` works back to front, which is what keeps the earlier
 * offsets true after the later ones have moved.
 */
export declare function applyReplaceAll(matches: TFindMatch[], replacement: string): TReplaceOutcome;
