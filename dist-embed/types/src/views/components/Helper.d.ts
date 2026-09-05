import { type ReactNode } from 'react';
import './helper.less';
export default function Helper({ onSelect, children }: {
    onSelect: (name: string) => void;
    children: ReactNode;
}): import("react").JSX.Element;
