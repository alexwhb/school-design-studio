import './findReplace.less';
export type FindReplaceHandle = {
    open: () => void;
};
/**
 * Find and replace.
 *
 * Built for the long designs — the assembly deck, the newsletter, the set of
 * certificates — where the same date or the same name is typed into a dozen
 * boxes spread over a dozen pages. Retyping those by hand is twenty-five
 * chances to miss one, and the one that gets missed goes to the print shop.
 *
 * So the search is over the whole design by default, and both ways of working
 * are here: Replace all for the common case, and Previous/Next stepping to the
 * match — changing page and selecting the box that holds it — for a string
 * short enough to turn up somewhere it was not meant to.
 *
 * Counts and outcomes are spoken out loud, because most of what a Replace all
 * changed is on a page nobody is looking at. A silent one is unnerving.
 */
declare const FindReplace: import("react").ForwardRefExoticComponent<import("react").RefAttributes<FindReplaceHandle>>;
export default FindReplace;
