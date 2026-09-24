import { type TIconItemSelectData } from './IconItemSelect';
type Props = {
    uuid: string;
    className?: string;
    label?: string;
    /** Buttons that belong on the same row but are this panel's own — an image's flips. */
    extra?: TIconItemSelectData[];
    onExtra?: (item: TIconItemSelectData) => void;
};
/**
 * Carries out one button of the Arrange row on a layer. Shared with the
 * context menu and the shortcuts, so that "bring to front" means the same
 * thing however it was asked for.
 */
export declare function arrangeLayer(uuid: string, item: Pick<TIconItemSelectData, 'key' | 'value'>): void;
/**
 * The Arrange row: the same buttons in every element's panel, reading the
 * layer's own state so a lock shows as on when the layer is locked.
 */
export default function ArrangeRow({ uuid, className, label, extra, onExtra }: Props): import("react").JSX.Element;
export {};
