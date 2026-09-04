import { type TIconItemSelectData } from './IconItemSelect';
import './alignRow.less';
type Props = {
    onFinish: (item: TIconItemSelectData) => void;
    /** Evening out the gaps needs a gap on either side of something, so three widgets. */
    distribute?: boolean;
    distributeDisabled?: boolean;
    className?: string;
};
export default function AlignRow({ onFinish, distribute, distributeDisabled, className }: Props): import("react").JSX.Element;
export {};
