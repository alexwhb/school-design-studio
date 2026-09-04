export type SliderProps = {
    value: number;
    min?: number;
    max?: number;
    step?: number;
    disabled?: boolean;
    className?: string;
    onChange?: (value: number) => void;
    onChangeEnd?: (value: number) => void;
};
export default function Slider({ value, min, max, step, disabled, className, onChange, onChangeEnd }: SliderProps): import("react").JSX.Element;
