import { type TCorners } from '../widgets/wRect/rectRadius';
import './cornerRadius.less';
type Props = {
    corners: TCorners;
    unlinked: boolean;
    /** Half the shorter side: past it the browser scales the corners down anyway. */
    maxValue: number;
    onLinkChange: (unlinked: boolean) => void;
    /** `index` is -1 while the corners are linked, meaning all four. */
    onChange: (index: number, value: number) => void;
};
export default function CornerRadius({ corners, unlinked, maxValue, onLinkChange, onChange }: Props): import("react").JSX.Element;
export {};
