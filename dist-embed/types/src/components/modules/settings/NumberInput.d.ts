import './numberInput.less';
type Props = {
    label?: string;
    value?: string | number;
    editable?: boolean;
    step?: number;
    maxValue?: string | number;
    minValue?: string | number;
    type?: string;
    prepend?: string;
    /** `underline` is the property-inspector shape: a mono key, then a rule under the number. */
    variant?: 'boxed' | 'underline';
    /** A unit shown after an underline field — px, °. */
    suffix?: string;
    className?: string;
    onChange: (value: number | string) => void;
    onFinish?: (value: number | string) => void;
};
export default function NumberInput({ label, value, editable, step, maxValue, minValue, type, prepend, variant, suffix, className, onChange, onFinish }: Props): import("react").JSX.Element;
export {};
