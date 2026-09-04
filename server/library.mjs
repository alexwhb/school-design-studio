/**
 * The read-only content library behind the editor's panels, as a function.
 *
 * Four things ask it the same six questions — `serve.mjs`, the two Vite dev
 * servers, and (once the editor is embedded) the host app — so it is a factory
 * that takes its configuration rather than a module that reads `.env` as it
 * loads. That is the difference between something a planner can mount on its
 * own router and something that only works in this repo.
 *
 * Framework-agnostic on purpose: `handle` takes a pathname and a
 * URLSearchParams and gives back a status, a body and any headers. No Express,
 * no `req`, no `res` — an Express wrapper is four lines, and so is a React
 * Router resource route, and neither can be written against the other one's
 * types.
 *
 * Deliberately dependency-free — Node's built-in `fetch` and the filesystem are
 * enough, and `npm start` stays a fresh-checkout command.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))

/**
 * Where the bundled templates, elements and stickers are.
 *
 * In this repo they are the service's own mock folder. In the published package
 * the build copies them next to the bundle, because `service/` is not shipped —
 * it exists to run a Puppeteer screenshot backend this fork does not use.
 */
function defaultContentRoot() {
  const candidates = [path.join(HERE, '..', 'dist-embed', 'content'), path.join(HERE, '..', 'service', 'src', 'mock')]
  return candidates.find((dir) => fs.existsSync(dir)) || candidates[1]
}

/**
 * The browse rows in the Photos panel. `cate` in the request is one of these
 * ids; each is really a stored Unsplash search. Names are duplicated in
 * `PhotoListWrap.tsx`, which shows them before any request goes out.
 */
const BROWSE_CATEGORIES = {
  1: 'school classroom students learning',
  2: 'abstract background texture pattern',
  3: 'sports team field game',
}

/** Widths requested from Unsplash's on-the-fly resizer. */
const THUMB_WIDTH = 400
// Large enough to stay sharp placed full-bleed on a Letter/A4 poster, without
// pulling a 30MP original into the canvas.
const FULL_WIDTH = 1600

/** The Elements panel's three rows, in the order it draws them. */
const MATERIAL_CATES = ['png', 'svg', 'mask']

/** "books" and "book" should find each other; nothing more clever than that. */
const singular = (word) => (word.length > 3 && word.endsWith('s') ? word.slice(0, -1) : word)

/**
 * How well one item's title answers a query, or 0 for no match. Higher wins,
 * so that searching "star" leads with the star rather than with "Stack of
 * books" — an item whose whole title is the query is almost always the one
 * that was meant.
 */
function titleScore(title, query, words) {
  const target = (title || '').toLowerCase()
  if (!target) return 0
  if (target === query) return 100
  if (target.startsWith(query)) return 80
  // Matching runs word by word rather than on the raw substring, which is
  // what keeps "pen" off "book open" while still finding "Gold star" for
  // "star" and "Stack of books" for "book".
  const targetWords = target
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .map(singular)
  if (targetWords.some((candidate) => candidate.startsWith(query))) return 60
  // Every word of the query has to land somewhere in the title, so "book cal"
  // matches nothing while "open book" still finds "book open".
  const all = words.every((word) => targetWords.some((candidate) => candidate.startsWith(word)))
  return all ? 40 : 0
}

/**
 * @param {{
 *   unsplashAccessKey?: string,
 *   unsplashAppName?: string,
 *   unsplashApiBase?: string,
 *   contentRoot?: string,
 * }} [options]
 */
export function createContentLibrary(options = {}) {
  const accessKey = options.unsplashAccessKey || ''
  // Unsplash asks that apps identify themselves in the attribution links they
  // render. Set this to your registered application name.
  const appName = options.unsplashAppName || 'design-studio'
  // Overridable so the proxy can be pointed at a stub in tests.
  const apiBase = (options.unsplashApiBase || 'https://api.unsplash.com').replace(/\/$/, '')
  const MOCK = path.resolve(options.contentRoot || defaultContentRoot())

  const hasUnsplashKey = Boolean(accessKey)

  /* ---------------------------------------------------------------------- */
  /* Unsplash                                                               */
  /* ---------------------------------------------------------------------- */

  function sized(rawUrl, width) {
    const url = new URL(rawUrl)
    url.searchParams.set('fm', 'jpg')
    url.searchParams.set('fit', 'max')
    url.searchParams.set('q', '80')
    url.searchParams.set('w', String(width))
    return url.toString()
  }

  function attributionUrl(link) {
    if (!link) return ''
    const url = new URL(link)
    url.searchParams.set('utm_source', appName)
    url.searchParams.set('utm_medium', 'referral')
    return url.toString()
  }

  /**
   * Unsplash's photo shape into the one the panels already render. `width` and
   * `height` stay the original dimensions: they only drive the aspect ratio and
   * the initial size on canvas, which `setImage` clamps to the page anyway.
   */
  function toPhoto(photo) {
    return {
      id: photo.id,
      // What the panel previews, and what gets placed on the canvas.
      thumb: sized(photo.urls.raw, THUMB_WIDTH),
      url: sized(photo.urls.raw, FULL_WIDTH),
      width: photo.width,
      height: photo.height,
      // Shown as a placeholder while the thumbnail loads.
      color: photo.color,
      description: photo.description || photo.alt_description || '',
      author: photo.user?.name || '',
      authorUrl: attributionUrl(photo.user?.links?.html),
      photoUrl: attributionUrl(photo.links?.html),
      // Unsplash requires a hit on this endpoint when a photo is actually used.
      downloadLocation: photo.links?.download_location || '',
      created_time: photo.created_at,
      updated_time: photo.updated_at,
      original: photo.id,
    }
  }

  /**
   * Responses are cached because the free Unsplash tier allows 50 requests an
   * hour, and an infinite-scrolling panel plus a search box will spend that in a
   * couple of minutes otherwise.
   *
   * Per library rather than per module: two libraries with two different keys
   * are two different accounts and must not read each other's answers.
   */
  const cache = new Map()
  const CACHE_TTL = 10 * 60 * 1000
  const CACHE_MAX = 200

  function cacheGet(key) {
    const hit = cache.get(key)
    if (!hit) return null
    if (Date.now() > hit.expires) {
      cache.delete(key)
      return null
    }
    return hit.value
  }

  function cacheSet(key, value) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value)
    cache.set(key, { value, expires: Date.now() + CACHE_TTL })
  }

  async function unsplash(endpoint, params) {
    const url = new URL(apiBase + endpoint)
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value))

    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    })

    if (!res.ok) {
      // 403 with the budget spent is the rate limit; 401 means the key is wrong.
      // Both are worth telling the user apart, because the fix differs.
      const spent = res.headers.get('x-ratelimit-remaining') === '0'
      const error = res.status === 401 ? 'unsplash_key_invalid' : res.status === 403 && spent ? 'unsplash_rate_limited' : 'unsplash_unavailable'
      const detail = await res.text().catch(() => '')
      console.warn(`[Design Studio] Unsplash ${endpoint} -> ${res.status} ${detail.slice(0, 200)}`)
      return { error }
    }

    return { data: await res.json() }
  }

  async function searchPhotos({ query, page, perPage }) {
    const key = `search:${query}:${page}:${perPage}`
    const cached = cacheGet(key)
    if (cached) return cached

    const { data, error } = await unsplash('/search/photos', {
      query,
      page,
      per_page: perPage,
      content_filter: 'high',
    })
    if (error) return { list: [], total: 0, error }

    const result = {
      list: (data.results || []).map(toPhoto),
      total: data.total ?? 0,
      provider: 'unsplash',
    }
    cacheSet(key, result)
    return result
  }

  async function listPhotos({ cate, page, perPage }) {
    const query = BROWSE_CATEGORIES[cate] || BROWSE_CATEGORIES[1]
    return searchPhotos({ query, page, perPage })
  }

  /**
   * Unsplash's API terms require a request to the photo's `download_location`
   * whenever it is actually used, which is how a photographer's downloads get
   * counted. It has to go through here because it needs the access key.
   */
  async function trackDownload(downloadLocation) {
    if (!hasUnsplashKey || !downloadLocation) return { ok: false }
    // Only ever call back to Unsplash, and only over TLS: the location arrives
    // from the client, so an untrusted value must not be able to aim a keyed
    // request anywhere else — and `http://api.unsplash.com/...` would put the
    // access key on the wire in the clear for anyone on the path to keep.
    let target
    try {
      target = new URL(downloadLocation)
    } catch {
      return { ok: false }
    }
    if (target.protocol !== 'https:') return { ok: false }
    if (target.hostname !== 'api.unsplash.com' && target.origin !== apiBase) return { ok: false }

    try {
      await fetch(target, { headers: { Authorization: `Client-ID ${accessKey}` } })
    } catch {
      // Attribution accounting is not worth failing a placement over.
    }
    return { ok: true }
  }

  /* ---------------------------------------------------------------------- */
  /* Bundled JSON                                                           */
  /* ---------------------------------------------------------------------- */

  function readMock(relative) {
    const file = path.resolve(MOCK, relative)
    if (!file.startsWith(MOCK) || !fs.existsSync(file)) return null
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'))
    } catch {
      return null
    }
  }

  /**
   * One page of a list.
   *
   * The panels scroll infinitely and stop only when a page comes back empty, so
   * answering every page with the whole file appends the same items over and
   * over. Paging here is what lets them terminate.
   */
  function pageOf(all, query) {
    const list = all || []
    const page = Math.max(1, Number(query.get('page')) || 1)
    const pageSize = Math.max(1, Number(query.get('pageSize')) || 20)
    return { list: list.slice((page - 1) * pageSize, page * pageSize), total: list.length }
  }

  /** One page of a mock list, filtered by the panel's search box. */
  function paged(all, query) {
    const keyword = (query.get('search') || '').trim().toLowerCase()
    const list = all || []
    return pageOf(keyword ? list.filter((item) => (item.title || '').toLowerCase().includes(keyword)) : list, query)
  }

  /**
   * The chips above the Templates panel.
   *
   * Names and order come from `templates/cates.json`, but only categories that
   * actually have a template are returned — otherwise removing the school pack
   * (`make-school-templates.py --remove`) would leave five chips over an empty
   * gallery. A template filed under a category the file does not name still gets
   * a chip, labelled with its own slug, so nothing ends up reachable only under
   * "All".
   */
  function templateCates() {
    const templates = readMock('templates/list.json') || []
    const used = new Set(templates.map((item) => item.cate).filter(Boolean))
    const named = readMock('templates/cates.json') || []
    const listed = named.filter((cate) => used.has(cate.id))
    const unlisted = [...used].filter((id) => !named.some((cate) => cate.id === id)).map((id) => ({ id, name: id.charAt(0).toUpperCase() + id.slice(1) }))
    return [...listed, ...unlisted]
  }

  /**
   * One page of templates, narrowed to a category when a chip is selected.
   *
   * Searching stays inside the selected category rather than escaping to the
   * whole gallery, which the Elements panel does — there the rows are hidden in
   * a dropdown, so scoping the search silently would strand results, whereas
   * here the selected chip is on screen next to the empty result.
   */
  function pagedTemplates(query) {
    const cate = (query.get('cate') || '').trim()
    const all = readMock('templates/list.json') || []
    return paged(cate ? all.filter((item) => item.cate === cate) : all, query)
  }

  /**
   * Free-text search over the element library. Searching is deliberately not
   * scoped to the row you happen to be looking at: the panel shows one flat list
   * of results, so typing "star" finds the sticker, the icon and the mask
   * without you having to guess which row it was filed under.
   */
  function searchMaterials(keyword, cate) {
    const query = keyword.trim().toLowerCase()
    if (!query) return []
    const words = query
      .split(/[^a-z0-9]+/)
      .filter(Boolean)
      .map(singular)
    const cates = cate && MATERIAL_CATES.includes(cate) ? [cate] : MATERIAL_CATES

    const scored = []
    for (const name of cates) {
      for (const item of readMock(`materials/${name}.json`) || []) {
        const score = titleScore(item.title, query, words)
        if (score) scored.push({ score, order: cates.indexOf(name), item })
      }
    }
    // Ties keep the library's own order, so repeating a search never reshuffles.
    scored.sort((a, b) => b.score - a.score || a.order - b.order)
    return scored.map((entry) => entry.item)
  }

  let warnedNoKey = false
  function warnNoKey() {
    if (warnedNoKey) return
    warnedNoKey = true
    console.info('[Design Studio] No Unsplash access key — the Photos panel is showing the bundled sample images and search is off. See README.md.')
  }

  /* ---------------------------------------------------------------------- */
  /* Routing                                                                */
  /* ---------------------------------------------------------------------- */

  /** Answers one `/design/*` lookup with the `result` payload, or null. */
  async function lookup(pathname, query) {
    const cate = query.get('cate')
    const type = query.get('type')
    const id = query.get('id')

    switch (pathname) {
      case '/design/cate':
        return templateCates()
      case '/design/list':
        // type=1 is the element/text component list, anything else is templates
        return type === '1' ? paged(readMock(`components/list/${cate}.json`), query) : pagedTemplates(query)
      case '/design/temp':
        return readMock(type === '1' ? `components/detail/${id}.json` : `templates/${id}.json`)
      case '/design/material': {
        const keyword = (query.get('search') || '').trim()
        if (keyword) return pageOf(searchMaterials(keyword, cate), query)
        return pageOf(readMock(`materials/${cate}.json`), query)
      }

      case '/design/imgs': {
        const keyword = (query.get('keyword') || '').trim()
        const page = Math.max(1, Number(query.get('page')) || 1)
        // Unsplash caps per_page at 30, which is also what the panel asks for.
        const perPage = Math.min(30, Math.max(1, Number(query.get('pageSize')) || 30))

        if (!hasUnsplashKey) {
          warnNoKey()
          // Searching cannot be faked, so say so rather than quietly returning
          // the same sample images for every term. Browsing still works.
          if (keyword) return { list: [], total: 0, error: 'unsplash_key_missing' }
          // One fixed page, trimmed to what was asked for — the browse rows want
          // two images each, not the whole file.
          const bundled = page > 1 ? [] : (readMock(`materials/photos/${cate || 1}.json`) || []).slice(0, perPage)
          return { list: bundled, total: bundled.length, provider: 'bundled' }
        }

        return keyword ? searchPhotos({ query: keyword, page, perPage }) : listPhotos({ cate: cate || 1, page, perPage })
      }

      case '/design/imgs/download':
        return trackDownload(query.get('location') || '')

      default:
        // Routes that serve a signed-in user's own files and designs. There is
        // no account system here, so answer with nothing rather than a 404 the
        // app would surface as an error.
        return { list: [], records: [], total: 0 }
    }
  }

  return {
    hasUnsplashKey,
    contentRoot: MOCK,
    /** The raw lookup, for a caller that wants to wrap the envelope itself. */
    lookup,
    /**
     * One request, answered whole: a status, the body to serialise as JSON, and
     * the headers to set. The envelope — `{ code, msg, result }` — is what the
     * editor's own client unwraps, so it is added here rather than by each of
     * the four callers.
     */
    async handle(pathname, searchParams) {
      const query = searchParams instanceof URLSearchParams ? searchParams : new URLSearchParams(searchParams || '')
      const result = await lookup(String(pathname || ''), query)
      return {
        status: 200,
        body: { code: 200, msg: 'ok', result: result ?? undefined },
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
      }
    },
  }
}

export default createContentLibrary
