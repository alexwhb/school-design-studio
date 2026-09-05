import type { TdWidgetData } from '../../../store/types';
import './selectionHeader.less';
type Props = {
    element: TdWidgetData | Record<string, any>;
};
export default function SelectionHeader({ element }: Props): import("react").JSX.Element;
export {};
