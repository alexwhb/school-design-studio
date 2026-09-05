import './searchHeader.less';
type Props = {
    value?: string;
    placeholder?: string;
    /** Search as you type, rather than waiting for Enter. */
    live?: boolean;
    onChange?: (value: string) => void;
    onSearch?: (value: string) => void;
};
/**
 * The search well at the top of a browsing panel.
 *
 * Its own markup rather than an Element Plus input: this is a well — a filled
 * box with a glyph in it — not a bordered field, and the two look nothing alike
 * once Element Plus has had its say about padding and height.
 */
export default function SearchHeader({ value, placeholder, live, onChange, onSearch }: Props): import("react").JSX.Element;
export {};
