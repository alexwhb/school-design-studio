import './zoomControl.less';
export type ZoomControlHandle = {
    screenChange: () => void;
    add: () => void;
    sub: () => void;
};
declare const ZoomControl: import("react").ForwardRefExoticComponent<import("react").RefAttributes<ZoomControlHandle>>;
export default ZoomControl;
