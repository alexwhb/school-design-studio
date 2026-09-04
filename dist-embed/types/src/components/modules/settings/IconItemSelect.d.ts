import type React from 'react';
import './iconItemSelect.less';
export type TIconItemSelectData = {
    key?: string;
    select?: boolean;
    extraIcon?: boolean;
    tip?: string;
    icon?: string;
    /** An inline icon, for the buttons the icon fonts have no glyph for. */
    Icon?: React.ComponentType<{
        className?: string;
    }>;
    /** Greyed out and inert: the action exists but cannot apply to what is selected. */
    disabled?: boolean;
    value?: string | number | number[] | string[];
};
type Props = {
    label?: string;
    data: TIconItemSelectData[];
    className?: string;
    onFinish?: (item: TIconItemSelectData) => void;
};
export default function IconItemSelect({ label, data, className, onFinish }: Props): React.JSX.Element;
export {};
