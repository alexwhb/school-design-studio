export type ConfirmType = 'success' | 'info' | 'warning' | 'error';
/** How the box was dismissed. Escape and the X decide nothing; Cancel does. */
export type ConfirmChoice = 'confirm' | 'cancel' | 'close';
type ConfirmExtra = {
    confirmButtonText?: string;
    cancelButtonText?: string;
    showCancelButton?: boolean;
    dangerouslyUseHTMLString?: boolean;
    inputValue?: string;
    inputPlaceholder?: string;
};
export default function confirm(title?: string, message?: string, type?: ConfirmType, extra?: ConfirmExtra): Promise<boolean>;
/**
 * Like `confirm`, but says how the box was dismissed.
 *
 * Cancel is an answer and Escape is not, which matters wherever the two would
 * lead somewhere different — throwing away a saved draft, say.
 */
export declare function confirmChoice(title: string, message: string, type?: ConfirmType, extra?: ConfirmExtra): Promise<ConfirmChoice>;
/** Asks for a line of text. */
export declare function promptText(title: string, message: string, extra?: ConfirmExtra): Promise<string | null>;
export {};
