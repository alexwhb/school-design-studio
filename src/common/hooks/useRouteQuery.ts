/**
 * The editor's own query string: `?id=`, `?tempid=`, `?cate=` and friends.
 *
 * Standalone, the editor is the whole tab, and the address is where it keeps
 * which design or template is open, so a reload opens it again. Embedded, the
 * address is the host's. Writing `?tempid=` into it after a template was
 * picked put the editor's query on the planner's page, and replacing the
 * history entry with a `null` state threw away what the host's router keeps
 * there, so its back button and scroll restoration stopped working. Reading it
 * picked up whatever the host's own page happened to have in its query.
 *
 * So embedded, the query lives here, in memory, and starts empty. Standalone
 * it is the address, as it always was, and a write keeps whatever the entry's
 * state already held.
 */
import { isEmbedded } from './appRoot'

export type RouteQuery = Record<string, string | undefined>

let held: RouteQuery = {}

export function readQuery(): RouteQuery {
  if (isEmbedded()) return { ...held }
  const params = new URLSearchParams(window.location.search)
  const out: RouteQuery = {}
  params.forEach((value, key) => {
    out[key] = value
  })
  return out
}

export function replaceQuery(next: RouteQuery) {
  if (isEmbedded()) {
    held = Object.fromEntries(Object.entries(next).filter(([, value]) => value !== undefined))
    return
  }
  const params = new URLSearchParams()
  Object.entries(next).forEach(([key, value]) => {
    value !== undefined && params.set(key, String(value))
  })
  const search = params.toString()
  window.history.replaceState(window.history.state, '', `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`)
}
