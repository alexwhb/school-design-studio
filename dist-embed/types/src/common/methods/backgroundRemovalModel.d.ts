import { type TRemovalProgress } from './backgroundRemoval';
/** Said when the library was never installed, which is not a network problem. */
export declare const MISSING_LIBRARY = "Cutting a background out in the browser needs the @huggingface/transformers package, which this app does not have installed. Ask for it, or pick the photo out another way.";
/** The photograph with its background cut away, as a PNG with an alpha channel. */
export declare function removeInBrowser(image: Blob, onProgress?: (progress: TRemovalProgress) => void): Promise<Blob>;
