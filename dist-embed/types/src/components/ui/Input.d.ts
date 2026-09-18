import { type InputHTMLAttributes, type Ref } from 'react';
export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'size'> & {
    value?: string;
    size?: 'large' | 'default' | 'small';
    onChange?: (value: string) => void;
    wrapperClassName?: string;
    /**
     * `underline` drops the box and keeps only the rule under the text, for a
     * field that sits inside a card which already has a border of its own — a
     * second box drawn 10px inside the first reads as two controls.
     */
    variant?: 'underline';
    /** The inner <input>, for the callers that have to put the caret in it. */
    ref?: Ref<HTMLInputElement>;
};
export default function Input({ value, size, variant, onChange, className, wrapperClassName, onFocus, onBlur, ref, ...rest }: InputProps): import("react").JSX.Element;
