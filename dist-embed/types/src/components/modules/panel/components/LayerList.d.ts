import type { TdWidgetData } from '../../../../store/types';
import './layerList.less';
type Props = {
    data: TdWidgetData[];
    onChange: (widgets: TdWidgetData[]) => void;
};
export default function LayerList({ data, onChange }: Props): import("react").JSX.Element;
export {};
