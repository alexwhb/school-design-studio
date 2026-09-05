import './borderControls.less';
type Props = {
    width?: number;
    color?: string;
    style?: string;
    /** Design pixels. Past this an outline is filling the thing it outlines. */
    maxWidth?: number;
    label?: string;
    onChange: (key: 'borderWidth' | 'borderColor' | 'borderStyle', value: number | string) => void;
};
export default function BorderControls({ width, color, style, maxWidth, label, onChange }: Props): import("react").JSX.Element;
export {};
