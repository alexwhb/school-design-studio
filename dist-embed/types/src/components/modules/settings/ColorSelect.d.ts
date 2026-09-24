import { type ColorChangeData } from '../../../packages/color-picker/ColorPicker';
import './colorSelect.less';
export type { ColorChangeData as colorChangeData };
type Props = {
    label?: string;
    value?: string;
    width?: string;
    modes?: string[];
    className?: string;
    /** `row` is the settings-panel shape: a checkbox, a wide swatch, a name and a pencil. */
    variant?: 'field' | 'row';
    /** A row's checkbox, for the panels where the colour can be switched off entirely. */
    enabled?: boolean;
    onEnabledChange?: (enabled: boolean) => void;
    /** See Popover: for a swatch that colours a text selection. */
    keepOpenOnFocusOutside?: boolean;
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: string) => void;
    onFinish?: (value: string) => void;
    onChange?: (data: ColorChangeData) => void;
};
export default function ColorSelect({ label, value, width, modes, className, variant, enabled, onEnabledChange, keepOpenOnFocusOutside, onOpenChange, onValueChange, onChange }: Props): import("react").JSX.Element;
