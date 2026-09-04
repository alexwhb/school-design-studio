import './containerWrap.less';
type Props = {
    value?: string;
    onChange?: (setting: Record<string, any>) => void;
};
export default function ContainerWrap({ value, onChange }: Props): import("react").JSX.Element;
export {};
