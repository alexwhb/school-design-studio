import type { CSSProperties, ReactNode } from 'react';
import type { TdWidgetData } from '../../../store/types';
export type WidgetParent = {
    left: number;
    top: number;
    [key: string]: any;
};
export type WidgetProps = {
    params: TdWidgetData;
    parent: WidgetParent;
    id?: string;
    className?: string;
    style?: CSSProperties;
    child?: boolean;
    children?: ReactNode;
    'data-title'?: string;
    'data-type'?: string;
    'data-uuid'?: string;
    /** Set by the presenter, so it can find this element to play its entrance. */
    'data-anim'?: string;
};
