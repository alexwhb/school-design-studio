import type { ReactNode } from 'react';
export type TooltipProps = {
    content: ReactNode;
    placement?: 'top' | 'bottom' | 'left' | 'right';
    effect?: 'dark' | 'light';
    showAfter?: number;
    disabled?: boolean;
    children: ReactNode;
    popperClass?: string;
};
export declare function TooltipProvider({ children }: {
    children: ReactNode;
}): import("react").JSX.Element;
export default function Tooltip({ content, placement, effect, showAfter, disabled, children, popperClass }: TooltipProps): import("react").JSX.Element;
