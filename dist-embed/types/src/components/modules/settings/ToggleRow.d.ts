/**
 * The settings panel's list row: a check that switches the thing on, what it
 * paints, its name, and a way further in.
 *
 * Every optional part of a design reads the same way here — a fill, a drop
 * shadow, the grid, the page's background — because they are all the same
 * question. Before this each one drew itself: a switch here, a checkbox with a
 * swatch beside it there, a full-width button somewhere else.
 */
import type { CSSProperties, ReactNode } from 'react';
import './toggleRow.less';
type Props = {
    label: ReactNode;
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
    /** What the row paints, drawn in the 30×16 swatch. Omit for a row with nothing to show. */
    swatch?: ReactNode;
    swatchStyle?: CSSProperties;
    /** Draws the swatch as a transparency checker when there is no colour behind it. */
    checker?: boolean;
    /** Set to give the row a chevron that opens whatever it stands for. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Controls at the right-hand end, instead of a chevron. */
    trailing?: ReactNode;
    className?: string;
    children?: ReactNode;
};
export default function ToggleRow({ label, checked, onCheckedChange, swatch, swatchStyle, checker, open, onOpenChange, trailing, className, children }: Props): import("react").JSX.Element;
export {};
