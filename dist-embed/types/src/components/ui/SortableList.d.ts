import { type ReactNode } from 'react';
type Props<T> = {
    items: T[];
    getKey: (item: T, index: number) => string;
    renderItem: (item: T, index: number) => ReactNode;
    onReorder: (items: T[]) => void;
    handle?: string;
    className?: string;
};
export default function SortableList<T>({ items, getKey, renderItem, onReorder, handle, className }: Props<T>): import("react").JSX.Element;
export {};
