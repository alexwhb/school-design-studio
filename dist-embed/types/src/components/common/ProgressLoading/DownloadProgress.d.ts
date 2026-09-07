import './downloadProgress.less';
type Props = {
    percent: number;
    text?: string;
    cancelText?: string;
    msg?: string;
    onCancel?: () => void;
    onDone?: () => void;
};
export default function DownloadProgress({ percent, text, cancelText, msg, onCancel }: Props): import("react").JSX.Element | null;
export {};
