import './transformGrid.less';
type Props = {
    active: Record<string, any>;
    onChange: (key: string, value: number | string) => void;
    /** Width and height cannot go to nothing on a shape; a text box sizes itself. */
    minSize?: number;
    /** Turned artwork also wants its angle here rather than only on the canvas. */
    rotation?: boolean;
};
export default function TransformGrid({ active, onChange, minSize, rotation }: Props): import("react").JSX.Element;
export {};
