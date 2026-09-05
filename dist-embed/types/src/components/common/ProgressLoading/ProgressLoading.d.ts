import './progressLoading.less';
type Props = {
    percent: number;
    text?: string;
    cancelText?: string;
    msg?: string;
    onCancel?: () => void;
    onDone?: () => void;
};
export default function ProgressLoading({ percent, text, cancelText, msg, onCancel, onDone }: Props): import("react").JSX.Element | null;
export {};
