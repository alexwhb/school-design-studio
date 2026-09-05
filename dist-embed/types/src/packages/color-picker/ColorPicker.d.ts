import { type GradientType } from './utils/gradient';
import './colorPicker.less';
export type ColorChangeData = {
    mode: string;
    color: string;
    /** Which way a linear gradient runs. A radial one ignores it. */
    angle: number;
    gradientType: GradientType;
    stops: {
        color: string;
        offset: number;
    }[];
};
type Props = {
    value?: string;
    modes?: string[];
    defaultColor?: string;
    defaultGradient?: string;
    defaultImage?: string;
    onValueChange?: (value: string) => void;
    onChange?: (data: ColorChangeData) => void;
    onNativePick?: (value: string) => void;
    onBlurColor?: (value: string) => void;
    /**
     * Recently used colours, and where to keep them.
     *
     * Element Plus leaves a popover's contents mounted once opened, so the Vue
     * picker's history outlives the popover; Radix unmounts them, which would
     * reset the row every time it is opened. The owner holds the list instead.
     */
    history?: string[];
    onHistoryChange?: (history: string[]) => void;
    /**
     * Named rows of colours offered above the recent ones — the school's brand
     * colours, so they are one click away from every swatch in the editor.
     */
    presets?: {
        label: string;
        colors: string[];
    }[];
};
export default function ColorPicker({ value, modes, defaultColor, defaultGradient, defaultImage, onValueChange, onChange, onNativePick, onBlurColor, history, onHistoryChange, presets }: Props): import("react").JSX.Element;
export {};
