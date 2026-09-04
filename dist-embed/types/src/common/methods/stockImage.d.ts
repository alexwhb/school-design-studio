export type StockImage = {
    url?: string;
    width?: number;
    height?: number;
    /** Unsplash's own name for the photographer, when the panel knows it. */
    author?: string;
    authorUrl?: string;
    photoUrl?: string;
    description?: string;
};
/** Whether this address is on somebody else's server rather than in the design. */
export declare function isRemoteImage(url: string | undefined): boolean;
/**
 * The picture as it should be written into the design.
 *
 * Returns the original when there is nothing to do, so every caller can use it
 * unconditionally. A failed import is reported and the placement is abandoned
 * rather than quietly falling back to the remote address — the host said it
 * wants copies, and half-honouring that would put exactly the URL it refuses
 * into the design it is about to save.
 */
export declare function resolveStockImage(item: StockImage): Promise<StockImage | null>;
