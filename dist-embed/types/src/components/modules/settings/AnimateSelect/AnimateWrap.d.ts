import type { TdWidgetData } from '../../../../store/types';
import './animateWrap.less';
type Props = {
    /** The store's own object, so writes go through the store and reads stay live. */
    widget: TdWidgetData;
};
/**
 * Animation is one section of the settings panel, not a card sitting on top of
 * it: the same left edge, the same uppercase heading and the same
 * label-above-control rhythm as Size and position or Text effects.
 */
export default function AnimateWrap({ widget }: Props): import("react").JSX.Element;
export {};
