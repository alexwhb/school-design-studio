import type { ReactNode } from 'react';
import './editModel.less';
type Option = {
    name: string;
    fn: (data: any) => void;
};
type Props = {
    options: Option[];
    data: any;
    children?: ReactNode;
};
export default function EditModel({ options, data, children }: Props): import("react").JSX.Element;
export {};
