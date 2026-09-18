export type SelectOption = {
    label: string;
    value: string | number;
};
type Props = {
    value: string | number;
    options: SelectOption[];
    className?: string;
    onChange: (value: string | number) => void;
};
export default function Select({ value, options, className, onChange }: Props): import("react").JSX.Element;
export {};
