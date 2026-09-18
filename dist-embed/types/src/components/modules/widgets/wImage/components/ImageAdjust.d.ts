import { type TImageFilters } from '../../../../../common/methods/imageFilters';
import './imageAdjust.less';
type Props = {
    uuid: string;
    filters?: TImageFilters;
};
export default function ImageAdjust({ uuid, filters }: Props): import("react").JSX.Element;
export {};
