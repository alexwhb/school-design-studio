import type { IGetTempListData } from '../../../../../api/home';
import './photoList.less';
type Props = {
    listData: IGetTempListData[];
    edit?: Record<string, any>;
    isDone?: boolean;
    isShort?: boolean;
    canDrag?: boolean;
    onLoad?: () => void;
    onSelect?: (index: number) => void;
    onDrag?: (index: number) => void;
};
export default function PhotoList({ listData, edit, isDone, isShort, canDrag, onLoad, onSelect, onDrag }: Props): import("react").JSX.Element;
export {};
