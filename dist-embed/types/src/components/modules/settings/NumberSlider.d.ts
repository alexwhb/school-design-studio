import './numberSlider.less';
type Props = {
    label?: string;
    value?: number;
    minValue?: number;
    maxValue?: number;
    step?: number;
    /**
     * Puts a typed field where the read-only number was, on the same line as the
     * run — the shape the opacity row has. A slider alone can only be aimed at a
     * value; this is where an exact one is typed.
     */
    field?: boolean;
    /** The unit shown after the typed field — °, px, %. */
    suffix?: string;
    style?: React.CSSProperties;
    className?: string;
    onChange?: (value: number) => void;
    onFinish?: (value: number) => void;
};
export default function NumberSlider({ label, value, minValue, maxValue, step, field, suffix, style, className, onChange, onFinish }: Props): import("react").JSX.Element;
export {};
