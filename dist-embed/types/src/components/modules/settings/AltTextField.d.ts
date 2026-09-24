import './altTextField.less';
type Props = {
    uuid: string;
    alt?: string;
    decorative?: boolean;
    /** One line on what happens to the description for this kind of element. */
    hint?: string;
};
/** Long enough for two good sentences, which is more than alt text should be. */
export declare const ALT_MAX_LENGTH = 300;
/**
 * The one place a picture gets described.
 *
 * Without it an exported PDF is a stack of photographs to a screen reader, and
 * a PowerPoint announces every picture by a file name. The box is small; what
 * rests on it is not, which is why it is a plain field in the panel rather than
 * something behind a menu.
 *
 * "Decorative" is a real answer, not a way out. A swoosh along the bottom of a
 * poster has nothing to say, and describing it makes the page worse to listen
 * to, but somebody has to decide that. The checkbox is that decision, and it
 * is what tells the check before a download not to ask about it again.
 *
 * Ported from the alt-text work on `t3code/accessible-pdf-export-and-alt-text`.
 */
export default function AltTextField({ uuid, alt, decorative, hint }: Props): import("react").JSX.Element;
export {};
