import './valueSelect.less';
type Props = {
    label?: string;
    value?: Record<string, any> | string | number;
    suffix?: string;
    data: Record<string, any> | any[];
    disable?: boolean;
    inputWidth?: string;
    readonly?: boolean;
    step?: number;
    /** `underline` drops the box and the chevron, leaving a rule under the value. */
    variant?: 'boxed' | 'underline';
    className?: string;
    onChange?: (value: Record<string, any> | string | number) => void;
    onFinish?: (value: Record<string, any> | string | number) => void;
};
export default function ValueSelect({ label, value, suffix, data, disable, inputWidth, readonly, step, variant, className, onChange, onFinish }: Props): import("react").JSX.Element;
export {};
