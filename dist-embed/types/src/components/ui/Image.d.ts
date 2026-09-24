import { type ReactNode } from 'react';
type Props = {
    src?: string;
    fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down';
    lazy?: boolean;
    className?: string;
    style?: React.CSSProperties;
    alt?: string;
    placeholder?: ReactNode;
    onError?: () => void;
    onClick?: (e: React.MouseEvent) => void;
};
export default function Image({ src, fit, lazy, className, style, alt, placeholder, onError, onClick }: Props): import("react").JSX.Element;
export {};
