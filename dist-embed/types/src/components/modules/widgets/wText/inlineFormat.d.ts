export type TInlineKind = 'bold' | 'italic' | 'underline' | 'strike';
export type TInlineRect = {
    left: number;
    top: number;
    width: number;
    height: number;
};
export declare const inlineState: {
    /** The widget whose text has the caret, or '' when none has. */
    uuid: string;
    /** Whether a run of text is selected, as opposed to a bare caret. */
    selected: boolean;
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strike: boolean;
    /** The selection's own colour, or '' for the box's. */
    color: string;
    /** The link the selection is inside, or ''. */
    href: string;
    /** Where the selection is on screen, for the toolbar to stand over. */
    rect: TInlineRect | null;
};
/** Whether `target` is one of the caret's own controls. */
export declare function isOwnControl(target: EventTarget | null | undefined): boolean;
/**
 * Whether a blur is focus going to one of the caret's own controls — by
 * keyboard, in which case the event says where, or by a press, in which case
 * focus goes nowhere in particular and only the press says.
 */
export declare function blurStaysInSession(relatedTarget: EventTarget | null): boolean;
export declare function startInlineSession(uuid: string, el: HTMLElement, onFinish: () => void): void;
export declare function endInlineSession(el: HTMLElement): void;
/** Whether the widget has the caret and a run of its text is selected. */
export declare function hasInlineSelection(uuid: string): boolean;
/**
 * Whether the box already carries this style all over, as a property of its
 * own. Inside such a box the browser's command would turn the style *off* for
 * the selection — as a span saying "not bold" — which the allowlist has no
 * word for, and which no export could carry. So there the style is the box's
 * to change, not the selection's: see toggleInline.
 */
export declare function boxHas(kind: TInlineKind): boolean;
/**
 * Bold, italic, underline or strikethrough on the selection; on a bare caret,
 * on whatever is typed next. False when there is no selection to put back, or
 * when the box carries the style itself (see boxHas); either way the caller
 * falls back to the whole box.
 */
export declare function toggleInline(kind: TInlineKind): boolean;
export declare function colourInline(color: string): boolean;
export declare function linkInline(url: string): boolean;
export declare function unlinkInline(): boolean;
