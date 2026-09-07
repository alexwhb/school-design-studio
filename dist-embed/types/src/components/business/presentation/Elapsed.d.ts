/**
 * The talk's running time, counted from a timestamp rather than held as a
 * number of seconds — which is what lets the presenter and the presenter view
 * show the same clock without either of them sending a tick to the other.
 *
 * Its own component because it ticks once a second, and the presenter's tree has
 * a mounted slide in it for every page within reach. Every one of those is
 * memoised and would skip the render, but there is no reason to ask.
 */
export default function Elapsed({ startedAt, onReset, className, title }: {
    startedAt: number;
    onReset: () => void;
    className?: string;
    title?: string;
}): import("react").JSX.Element;
