import { type ReactNode } from 'react';
export type TabItem = {
    name: string;
    label: ReactNode;
};
type Props = {
    value: string;
    items: TabItem[];
    onChange: (name: string) => void;
    stretch?: boolean;
    children?: ReactNode;
    className?: string;
};
export default function Tabs({ value, items, onChange, stretch, children, className }: Props): import("react").JSX.Element;
export {};
