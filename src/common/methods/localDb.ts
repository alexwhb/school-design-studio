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

const DB_NAME = 'design-studio'
const DB_VERSION = 4

export const STORES = {
  /** Uploaded and pasted pictures, keyed by a generated id. */
  uploads: 'uploads',
  /** Saved designs, without their artwork: title, page count, timestamp. */
  designs: 'designs',
  /** One row per page of a saved design, so a save can rewrite just the page
   *  that changed rather than the whole deck. See localDesigns.ts. */
  designPages: 'designPages',
  /** The school's brand kit: one row, keyed 'kit'. See brandKit.ts. */
  brand: 'brand',
} as const

export type StoreName = (typeof STORES)[keyof typeof STORES]

let dbPromise: Promise<IDBDatabase> | null = null

export function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)
      request.onupgradeneeded = () => {
        const db = request.result
        // Create whatever is missing rather than keying off the old version
        // number: someone who used the editor before designs existed arrives
        // here at version 1 with an uploads store full of pictures, and those
        // have to survive.
        for (const name of Object.values(STORES)) {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' })
          }
        }
      }
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
      // Another tab holding the old version open blocks the upgrade. Say so:
      // silently hanging looks exactly like a broken editor.
      request.onblocked = () => reject(new Error('Another tab has the editor open. Close it and reload.'))
    }).catch((error) => {
      // Let the next call try again rather than caching the failure forever.
      dbPromise = null
      throw error
    })
  }
  return dbPromise
}

/**
 * Runs several requests across several stores as one transaction.
 *
 * `run` is one request and one store, which is all a read needs. A save is not:
 * the meta row and every changed page have to land together or not at all, or a
 * crash mid-write leaves a page count that does not match the pages. Resolves
 * when the transaction commits, so the caller knows the bytes are down.
 */
export function runBatch(stores: StoreName[], mode: IDBTransactionMode, work: (store: (name: StoreName) => IDBObjectStore) => void): Promise<void> {
  return openDb().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(stores, mode)
        tx.oncomplete = () => resolve()
        // A failed request aborts the transaction, so this covers quota too.
        tx.onerror = () => reject(tx.error)
        tx.onabort = () => reject(tx.error ?? new Error('The write was aborted.'))
        try {
          work((name) => tx.objectStore(name))
        } catch (error) {
          tx.abort()
          reject(error)
        }
      }),
  )
}

/** Runs one request against one store and resolves with its result. */
export function run<T>(store: StoreName, mode: IDBTransactionMode, work: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode)
        const request = work(tx.objectStore(store))
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
      }),
  )
}
