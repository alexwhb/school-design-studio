import './filterChips.less';
/**
 * "None of them" — a panel showing search results rather than a category, where
 * leaving the value alone would light up whichever chip happens to match.
 */
export declare const NO_CHIP = -1;
export type TFilterChip = {
    id: string | number;
    name: string;
};
type Props<T extends TFilterChip> = {
    items: T[];
    /** The selected chip's id. */
    value: string | number;
    onChange: (item: T) => void;
};
export default function FilterChips<T extends TFilterChip>({ items, value, onChange }: Props<T>): import("react").JSX.Element | null;
export {};
