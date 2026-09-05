/**
 * One thing you can put on the page: a template, a sticker, a photo, a preset.
 *
 * All four panels draw the same object — a thumbnail box of a fixed shape with
 * an optional caption under it — so the tile, its hover and its caption type
 * live here rather than being written out again in every panel's stylesheet,
 * which is how the Elements panel ended up with 4px corners and the Templates
 * panel with 5px.
 */
import type { HTMLAttributes, ReactNode } from 'react';
import './card.less';
type Props = {
    /** The thumbnail's shape, as a CSS aspect-ratio. */
    ratio?: string;
    name?: ReactNode;
    /** The line under the name, set in the metadata mono. */
    meta?: ReactNode;
    children?: ReactNode;
    thumbClassName?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>;
export default function Card({ ratio, name, meta, children, className, thumbClassName, ...rest }: Props): import("react").JSX.Element;
type GridProps = {
    columns?: 2 | 3;
    className?: string;
    children: ReactNode;
};
export declare function CardGrid({ columns, className, children }: GridProps): import("react").JSX.Element;
export declare function CardRows({ className, children }: {
    className?: string;
    children: ReactNode;
}): import("react").JSX.Element;
export {};
