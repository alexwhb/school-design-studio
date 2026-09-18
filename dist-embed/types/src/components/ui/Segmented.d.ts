import './segmented.less';
export type SegmentedOption = {
    label: string;
    value: string;
};
type Props = {
    value: string;
    options: Array<SegmentedOption | string>;
    onChange: (value: string) => void;
    /** `sm` is for a segmented control nested inside a row that already has a label. */
    size?: 'sm' | 'md';
    className?: string;
    'aria-label'?: string;
};
/**
 * One control for picking one of a few things.
 *
 * The editor grew four of these — a pair of spans in the settings panel, the
 * colour picker's own sliding-thumb tabs, a one-option radio group left over
 * from upstream, and a row of filter chips — each with its own height, radius
 * and idea of what "selected" looks like. Two of them sat 250px apart in the
 * same panel.
 *
 * The thumb slides rather than the segments repainting, which is what makes the
 * change read as one control rather than two buttons swapping states.
 */
export default function Segmented({ value, options, onChange, size, className, 'aria-label': ariaLabel }: Props): import("react").JSX.Element;
export {};
