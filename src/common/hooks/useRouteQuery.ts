export type RouteQuery = Record<string, string | undefined>

export function readQuery(): RouteQuery {
  const params = new URLSearchParams(window.location.search)
  const out: RouteQuery = {}
  params.forEach((value, key) => {
    out[key] = value
  })
  return out
}

export function replaceQuery(next: RouteQuery) {
  const params = new URLSearchParams()
  Object.entries(next).forEach(([key, value]) => {
    value !== undefined && params.set(key, String(value))
  })
  const search = params.toString()
  window.history.replaceState(null, '', search ? `${window.location.pathname}?${search}` : window.location.pathname)
}
