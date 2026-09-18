import { type RefObject } from 'react';
export type TourHandle = {
    open: () => void;
};
type Props = {
    steps: RefObject<HTMLElement | null>[];
};
declare const Tour: import("react").ForwardRefExoticComponent<Props & import("react").RefAttributes<TourHandle>>;
export default Tour;
