/**
 * Runs `callback` when the value `select` returns changes.
 *
 * valtio's own `subscribe` fires for every mutation anywhere under the object
 * and hands the callback an empty op list unless op tracking is switched on
 * through an unstable API, so a selector is the reliable way to watch one
 * slice of the store.
 */
export declare function subscribeSelector<T>(target: object, select: () => T, callback: (value: T) => void): () => void;
