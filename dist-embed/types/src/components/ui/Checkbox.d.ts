type Props = {
    value: boolean;
    label?: string;
    size?: 'large' | 'default' | 'small';
    className?: string;
    onChange: (value: boolean) => void;
};
export default function Checkbox({ value, label, size, className, onChange }: Props): import("react").JSX.Element;
export {};
