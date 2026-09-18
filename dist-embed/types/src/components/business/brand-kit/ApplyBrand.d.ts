import './applyBrand.less';
type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};
/**
 * Apply brand to this design.
 *
 * For the design that was made before the kit was, or brought in from
 * somewhere else: every school field on every page is filled in, the text is
 * set in the school's fonts, and — if asked — the design's colours become the
 * school's. One dialog, one confirmation, one undo step. The rules are said
 * here rather than left to be discovered, because the font pass in particular
 * has to guess which lines are headings and the guess should be checkable.
 */
export default function ApplyBrand({ open, onOpenChange }: Props): import("react").JSX.Element;
export {};
