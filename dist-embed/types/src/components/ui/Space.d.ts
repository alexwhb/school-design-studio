import { type ReactNode } from 'react';
type Props = {
    direction?: 'horizontal' | 'vertical';
    wrap?: boolean;
    fill?: boolean;
    fillRatio?: number;
    className?: string;
    children?: ReactNode;
};
export default function Space({ direction, wrap, fill, fillRatio, className, children }: Props): import("react").JSX.Element;
export {};
