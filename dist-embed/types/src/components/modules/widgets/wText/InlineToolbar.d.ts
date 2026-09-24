import { type TInlineKind } from './inlineFormat';
import './inlineToolbar.less';
type Props = {
    /** The box's own colour, which is what an uncoloured selection shows as. */
    color: string;
    /**
     * Takes a style off the whole box. Pressing Bold in a box that is bold all
     * over means the box — there is no such thing as a less-bold word inside it,
     * see inlineFormat.ts — so the bar falls back to this the way the panel does.
     */
    onBoxToggle: (kind: TInlineKind) => void;
};
export default function InlineToolbar({ color, onBoxToggle }: Props): import("react").ReactPortal | null;
export {};
