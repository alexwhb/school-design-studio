import { type ReactNode } from 'react';
import type { TdWidgetData, TPageState } from '../../../../store/types';
import './designBoard.less';
type Props = {
    pageDesignCanvasId: string;
    padding?: number;
    renderDPage?: TPageState;
    renderDWidgets?: TdWidgetData[];
    zoom?: number;
    className?: string;
    children?: ReactNode;
    bottom?: ReactNode;
};
export default function DesignBoard({ pageDesignCanvasId, padding, renderDPage, renderDWidgets, zoom, className, children, bottom }: Props): import("react").JSX.Element;
export {};
