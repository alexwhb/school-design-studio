import type { TGetImageListResult } from '../../../api/material';
import './pictureSelector.less';
export type PictureSelectorHandle = {
    open: () => void;
};
type Props = {
    onSelect?: (item: TGetImageListResult) => void;
};
declare const PictureSelector: import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<PictureSelectorHandle>>;
export default PictureSelector;
