export type SwitchProps = {
    value?: boolean;
    size?: 'large' | 'default' | 'small';
    disabled?: boolean;
    onChange?: (value: boolean) => void;
    className?: string;
};
export default function Switch({ value, size, disabled, onChange, className }: SwitchProps): import("react").JSX.Element;
