import { type ReactNode } from 'react';
export type DropdownProps = {
    children: ReactNode;
    menu: ReactNode;
    placement?: string;
    hideOnClick?: boolean;
    maxHeight?: string;
    menuClassName?: string;
    /** Element Plus sizes the menu, not the trigger: `large` gives taller items. */
    size?: 'large' | 'default' | 'small';
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};
export declare function DropdownItem({ children, onSelect, divided, disabled, closeOnSelect }: {
    children: ReactNode;
    onSelect?: () => void;
    divided?: boolean;
    disabled?: boolean;
    closeOnSelect?: boolean;
}): import("react").JSX.Element;
export default function Dropdown({ children, menu, placement, maxHeight, menuClassName, size, open, onOpenChange }: DropdownProps): import("react").JSX.Element;
