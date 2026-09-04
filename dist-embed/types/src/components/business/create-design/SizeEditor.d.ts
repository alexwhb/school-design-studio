import { type ReactNode } from 'react';
import './sizeEditor.less';
type Props = {
    params: {
        width: number;
        height: number;
        [key: string]: any;
    };
    onChange?: (next: {
        width: number;
        height: number;
    }) => void;
    className?: string;
    children?: ReactNode;
};
export default function SizeEditor({ params, onChange, className, children }: Props): import("react").JSX.Element;
export {};
