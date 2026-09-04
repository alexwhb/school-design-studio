/**
 * Every kind of thing a design can hold, and where each of them keeps a URL.
 *
 * Split out from `registry.ts` because that file imports the React components
 * and this has to be readable by `design-studio/compose`, which runs on a
 * server. It is not a copy of the registry: the registry's two maps are typed
 * as `Record<TWidgetType, …>`, so a widget added to one and not the other fails
 * the build. That is the only guarantee worth having — a list kept in step by
 * hand is a list that drifts on the day somebody is in a hurry.
 *
 * The planner validates a design against these before storing it: every layer's
 * `type` has to be one it knows, and every URL-bearing field has to be
 * same-origin or a data URL, because a design that points at somebody else's
 * server stops rendering the day that server changes its mind.
 */

export const WIDGET_TYPES = ['w-text', 'w-image', 'w-svg', 'w-rect', 'w-ellipse', 'w-polygon', 'w-path', 'w-group', 'w-qrcode', 'w-table'] as const

export type TWidgetType = (typeof WIDGET_TYPES)[number]

/** The page itself, which is not a widget but carries a picture of its own. */
export const PAGE_TYPE = 'page'

/**
 * Per type, the fields carrying a URL or a piece of inline markup.
 *
 * Both, and not only URLs, because both are things the host has to look at
 * before it stores them: a `svgUrl` is usually a whole `<svg>` document rather
 * than an address, and a text widget's `text` is HTML. Run the markup ones
 * through `sanitizeMarkup` and check the addresses against your own origin.
 *
 * `page` is in here too. A page background is a picture like any other and is
 * the one people forget, because it is not on a layer.
 */
export const URL_FIELDS: Record<string, readonly string[]> = {
  page: ['backgroundImage'],
  'w-text': ['text'],
  // `originalImgUrl` is the photograph as it was before its background was cut
  // out, kept so it can be put back — a second full-size picture on the widget.
  'w-image': ['imgUrl', 'originalImgUrl', 'mask'],
  'w-svg': ['svgUrl', 'imgUrl'],
  'w-rect': [],
  'w-ellipse': [],
  'w-polygon': [],
  'w-path': [],
  'w-group': [],
  // The address the code points at, which is drawn rather than fetched.
  'w-qrcode': ['url'],
  // One string of markup per cell, the same shape a text widget's `text` is.
  'w-table': ['cells'],
}

/**
 * URLs that are not a field of the layer but a field of something inside it.
 *
 * `URL_FIELDS` is a flat list of names because that is what most of them are.
 * These two are not, and a host that checked only the flat list would let a
 * document point at somebody else's server through either of them: a text
 * effect can be filled with a picture, and a font can name the file it is
 * loaded from. Neither is something a person types — the editor writes both
 * from its own bundled lists — which is exactly why a document arriving from
 * outside should be made to prove it.
 *
 * Paths are dotted, with `[]` for "every element of this array".
 */
export const NESTED_URL_PATHS: Record<string, readonly string[]> = {
  'w-text': ['fontClass.url', 'textEffects[].filling.imageContent.image'],
  'w-table': ['fontClass.url'],
}
