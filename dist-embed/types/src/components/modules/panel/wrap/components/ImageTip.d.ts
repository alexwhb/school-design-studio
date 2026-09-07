import type { ReactNode } from 'react';
export type TImageTipDetailData = {
    author: string;
    description: string;
};
export default function ImageTip({ detail, children }: {
    detail: TImageTipDetailData;
    children: ReactNode;
}): import("react").JSX.Element;
