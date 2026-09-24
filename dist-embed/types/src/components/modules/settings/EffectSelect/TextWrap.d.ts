import './textWrap.less';
type Props = {
    value?: Record<string, any>[];
    data: Record<string, any>;
    degree?: string | number;
    onValueChange?: (value: Record<string, any>[]) => void;
    /** A preset carries the colour it was drawn around; the widget needs it too. */
    onSelect?: (data: {
        key: string;
        value: string;
    }) => void;
};
export default function TextWrap({ value, data, onValueChange, onSelect }: Props): import("react").JSX.Element;
export {};
