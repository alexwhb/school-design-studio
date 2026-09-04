import { type TRemovalProgress } from './backgroundRemoval';
/** The photograph with its background cut away, as a PNG with an alpha channel. */
export declare function removeInBrowser(image: Blob, onProgress?: (progress: TRemovalProgress) => void): Promise<Blob>;
