import { type TBackgroundTransform } from '../../../../../common/methods/pageBackground';
import type { TPageState } from '../../../../../store/types';
import './backgroundCrop.less';
type Props = {
    page: TPageState;
    onChange: (transform: TBackgroundTransform) => void;
};
/**
 * Chooses which part of a background picture is on show.
 *
 * The preview is the page at a smaller size and is painted by the same code as
 * the canvas, so what you drag here is what you get there. Dragging moves the
 * picture under a fixed window: the distance the pointer travels is turned into
 * a share of however much of the picture is hidden, which is the only reason
 * this needs to know the picture's shape.
 */
export default function BackgroundCrop({ page, onChange }: Props): import("react").JSX.Element;
export {};
