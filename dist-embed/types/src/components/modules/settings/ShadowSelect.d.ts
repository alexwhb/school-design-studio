import { type TWidgetShadow } from '../../../common/methods/shadow';
import './shadowSelect.less';
type Props = {
    value?: TWidgetShadow;
    /** `null` takes the shadow off the widget rather than leaving it switched off. */
    onChange: (value: TWidgetShadow | null) => void;
    className?: string;
};
export default function ShadowSelect({ value, onChange, className }: Props): import("react").JSX.Element;
export {};
