import type { TdLayout } from '../../../store/types';
import './slideView.less';
export type SlideViewHandle = {
    stepCount: number;
    showUpTo: (target: number, animate: boolean) => void;
};
type Props = {
    page: TdLayout;
    /** The box the slide has to fit inside, in CSS pixels. */
    maxWidth: number;
    maxHeight: number;
    /** Play the elements' entrances. Off for thumbnails, which want a built slide. */
    animated?: boolean;
};
declare const _default: import("react").NamedExoticComponent<Props & import("react").RefAttributes<SlideViewHandle>>;
export default _default;
