export type TImageSetting = {
    name: string;
    type: string;
    uuid: string;
    width: number;
    height: number;
    left: number;
    top: number;
    zoom: number;
    /** The crop's vertical scale, when the grips have left it unlike the horizontal one. */
    zoomY?: number;
    transform: string;
    radius: number;
    opacity: number;
    borderWidth: number;
    borderColor: string;
    borderStyle: string;
    parent: string;
    imgUrl: string;
    mask: string;
    setting: [];
    rotate: number;
    record: {
        width: number;
        height: number;
        minWidth: number;
        minHeight: number;
        dir: string;
    };
    lock: false;
    isNinePatch: false;
    flip: string | null;
    sliceData: {
        ratio: number;
        left: number;
    };
    cropEdit?: boolean;
};
declare const setting: TImageSetting;
export default setting;
