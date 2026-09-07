import './textInputArea.less';
type Props = {
    label?: string;
    value?: string;
    editable?: boolean;
    max?: string | number;
    onChange?: (value: string) => void;
    onFinish?: (value: string) => void;
};
export default function TextInputArea({ label, value, editable, max, onChange, onFinish }: Props): import("react").JSX.Element;
export {};
