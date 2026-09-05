export type TEmitChangeData = {
    downloadPercent: number | null;
    downloadText: string;
    downloadMsg?: string;
    cancelText?: string;
};
type Props = {
    isDone?: boolean;
    onChange: (data: TEmitChangeData) => void;
};
export default function UploadTemplate({ isDone, onChange }: Props): import("react").JSX.Element;
export {};
