import './sizePresets.less';
type Props = {
    /** Marks whichever preset matches, so the current size is obvious in the list. */
    width?: number;
    height?: number;
    onPick: (size: {
        width: number;
        height: number;
    }) => void;
};
/**
 * The list of page sizes a school actually uses.
 *
 * Shared by the new-design dialog and the resize dialog, which ask the same
 * question at different moments — "how big is this?" — and should not answer it
 * with two different lists.
 */
export default function SizePresets({ width, height, onPick }: Props): import("react").JSX.Element;
export {};
