/**
 * The browser-side database, and the only place its schema is written down.
 *
 * Three things live in here: the pictures someone uploads (see localUploads.ts),
 * the design they are working on (see localDesigns.ts) and the school's brand
 * kit (see brandKit.ts). All of them used to belong, or would belong, to a
 * backend this fork does not have, and all are the seam to re-point at one
 * that does — swap the bodies of the modules above, not this file.
 *
 * IndexedDB rather than localStorage because localStorage caps out around 5MB
 * across the whole origin, which one phone photo can spend on its own.
 *
 * Adding a store means adding it to STORES and bumping DB_VERSION. Both modules
 * open the database through here so that never happens twice with two different
 * version numbers, which is the way to get `VersionError` and a dead editor.
 */
export declare const STORES: {
    /** Uploaded and pasted pictures, keyed by a generated id. */
    readonly uploads: "uploads";
    /** Saved designs, without their artwork: title, page count, timestamp. */
    readonly designs: "designs";
    /** One row per page of a saved design, so a save can rewrite just the page
     *  that changed rather than the whole deck. See localDesigns.ts. */
    readonly designPages: "designPages";
    /** The school's brand kit: one row, keyed 'kit'. See brandKit.ts. */
    readonly brand: "brand";
};
export type StoreName = (typeof STORES)[keyof typeof STORES];
export declare function openDb(): Promise<IDBDatabase>;
/**
 * Runs several requests across several stores as one transaction.
 *
 * `run` is one request and one store, which is all a read needs. A save is not:
 * the meta row and every changed page have to land together or not at all, or a
 * crash mid-write leaves a page count that does not match the pages. Resolves
 * when the transaction commits, so the caller knows the bytes are down.
 */
export declare function runBatch(stores: StoreName[], mode: IDBTransactionMode, work: (store: (name: StoreName) => IDBObjectStore) => void): Promise<void>;
/** Runs one request against one store and resolves with its result. */
export declare function run<T>(store: StoreName, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T>;
