import './angleHandle.less';
type Props = {
    value: number;
    onChange: (value: number) => void;
    onCommit?: () => void;
};
export default function AngleHandle({ value, onChange, onCommit }: Props): import("react").JSX.Element;
export {};
