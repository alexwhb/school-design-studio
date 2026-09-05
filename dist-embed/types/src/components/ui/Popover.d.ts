import { type ReactNode } from 'react';
export type PopoverProps = {
    content: ReactNode;
    placement?: string;
    width?: number | string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: 'click' | 'hover';
    popperClass?: string;
    /**
     * Stay open when focus moves elsewhere. For a picker that applies to a text
     * selection: applying puts focus back in the text, which Radix would
     * otherwise read as leaving the popover.
     */
    keepOpenOnFocusOutside?: boolean;
    children: ReactNode;
};
export default function Popover({ content, placement, width, open, onOpenChange, popperClass, keepOpenOnFocusOutside, children }: PopoverProps): import("react").JSX.Element;
