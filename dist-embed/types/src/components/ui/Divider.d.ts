import type { ReactNode } from 'react';
type Props = {
    direction?: 'horizontal' | 'vertical';
    contentPosition?: 'left' | 'center' | 'right';
    className?: string;
    style?: React.CSSProperties;
    children?: ReactNode;
};
export default function Divider({ direction, contentPosition, className, style, children }: Props): import("react").JSX.Element;
export {};
