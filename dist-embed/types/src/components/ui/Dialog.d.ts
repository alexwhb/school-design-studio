import type { ReactNode } from 'react';
export type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title?: ReactNode;
    width?: string | number;
    footer?: ReactNode;
    showClose?: boolean;
    closeOnClickModal?: boolean;
    className?: string;
    children?: ReactNode;
    appendToBody?: boolean;
};
export default function Dialog({ open, onOpenChange, title, width, footer, showClose, closeOnClickModal, className, children }: DialogProps): import("react").JSX.Element;
