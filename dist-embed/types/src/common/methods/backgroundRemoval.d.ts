export type TRemovalProgress = {
    /** 0 to 1 while the model comes down, or -1 for work with no measurable end. */
    fraction: number;
    /** What to show the person waiting. */
    message: string;
};
export type TBackgroundRemover = (image: Blob, onProgress?: (progress: TRemovalProgress) => void) => Promise<Blob>;
/** Hands the work to a host app's own implementation. Pass null to take it back. */
export declare function setBackgroundRemover(remover: TBackgroundRemover | null): void;
/** Whether the button should be offered at all. */
export declare function canRemoveBackground(): boolean;
/**
 * Said when the work fails and nothing more specific is known.
 *
 * Which is nearly always a network problem: the model is a download, cached by
 * the browser afterwards, so the first cut-out on a machine is the one that
 * needs a connection and every later one does not.
 */
export declare const REMOVAL_FAILED = "The background could not be removed";
export declare const REMOVAL_FAILED_DETAIL = "This needs an internet connection the first time. After one photo has been cut out on this computer it works offline.";
/** The picture with its background gone, as a PNG with transparency. */
export declare function removeBackground(image: Blob, onProgress?: (progress: TRemovalProgress) => void): Promise<Blob>;
