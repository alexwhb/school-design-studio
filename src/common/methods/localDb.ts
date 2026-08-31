/**
 * The browser-side database, and the only place its schema is written down.
 *
 * Two things live in here: the pictures someone uploads (see localUploads.ts)
 * and the design they are working on (see localDesigns.ts). Both used to belong
 * to a backend this fork does not have, and both are the seam to re-point at
 * one that does — swap the bodies of the modules above, not this file.
 *
 * IndexedDB rather than localStorage because localStorage caps out around 5MB
 * across the whole origin, which one phone photo can spend on its own.
 *
 * Adding a store means adding it to STORES and bumping DB_VERSION. Both modules
 * open the database through here so that never happens twice with two different
 * version numbers, which is the way to get `VersionError` and a dead editor.
 */

const DB_NAME = 'design-studio'
const DB_VERSION = 2

export const STORES = {
  /** Uploaded and pasted pictures, keyed by a generated id. */
  uploads: 'uploads',
  /** Saved designs. Today that is one row, the autosaved draft. */
  designs: 'designs',
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
