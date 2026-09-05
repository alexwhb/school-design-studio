import { type ReactNode } from 'react';
import './panelSection.less';
type Props = {
    name?: string;
    title: ReactNode;
    /** Controls sitting at the right-hand end of the heading row. */
    aside?: ReactNode;
    children: ReactNode;
    /** Set to drive a lone section's open state from outside a group. */
    open?: boolean;
    onToggle?: (name: string) => void;
    className?: string;
};
export declare function PanelSection({ name, title, aside, children, open, onToggle, className }: Props): import("react").JSX.Element;
export default function PanelSections({ value, onChange, children, className }: {
    value: string[];
    onChange: (next: string[]) => void;
    children: ReactNode;
    className?: string;
}): import("react").JSX.Element;
export declare function useSections(initial: string[]): [string[], import("react").Dispatch<import("react").SetStateAction<string[]>>];
export {};
