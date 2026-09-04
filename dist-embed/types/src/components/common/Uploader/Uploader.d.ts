import { type ReactNode } from 'react';
import './uploader.less';
export type TModelData = {
    num?: string | number;
    ratio?: string;
};
export type TUploadDoneData = {
    width: number;
    height: number;
    url: string;
    id?: string;
    title?: string;
};
type Props = {
    value?: TModelData;
    hold?: boolean;
    accept?: string;
    drag?: boolean;
    className?: string;
    style?: React.CSSProperties;
    onChange?: (data: TModelData) => void;
    onDone?: (data: TUploadDoneData) => void;
    onLoad?: (file: File) => void;
    children?: ReactNode;
};
export default function Uploader({ value, hold, accept, drag, className, style, onChange, onDone, onLoad, children }: Props): import("react").JSX.Element;
export {};
