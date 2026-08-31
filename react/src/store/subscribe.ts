import { subscribe } from 'valtio'

function shallowEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false
  }
  return true
}

/**
 * Runs `callback` when the value `select` returns changes.
 *
 * valtio's own `subscribe` fires for every mutation anywhere under the object
 * and hands the callback an empty op list unless op tracking is switched on
 * through an unstable API, so a selector is the reliable way to watch one
 * slice of the store.
 */
export function subscribeSelector<T>(target: object, select: () => T, callback: (value: T) => void): () => void {
  let previous = select()
  return subscribe(target, () => {
    const next = select()
    if (shallowEqual(previous, next)) return
    previous = next
    callback(next)
  })
}
