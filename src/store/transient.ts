/**
 * Flags a widget carries while it is being worked on, and never after.
 *
 * `editable` is written to the store while a text box or a table has the caret,
 * because the shortcuts, copy and paste and the selection box all read it to
 * tell a box being typed into from one being moved about. `cropEdit` is the
 * same for a shape being cropped. Both belong to this tab's editing session,
 * not to the design: saved, a box came back from the host still claiming the
 * caret, and on reopening it ignored Delete, the arrow keys, Ctrl+C and Ctrl+D
 * until somebody double-clicked it and clicked away again.
 *
 * So they are taken off every copy of a design that leaves the store, and off
 * every design that arrives. Nothing here imports anything, so the compose
 * entry can read it on a server.
 */
export const TRANSIENT_FIELDS: readonly string[] = ['editable', 'cropEdit']

const TRANSIENT = new Set(TRANSIENT_FIELDS)

/**
 * A `JSON.stringify` replacer that leaves out an editing flag that is set.
 *
 * Only a set one. A widget's defaults say `editable: false`, and every design
 * ever composed carries that; dropping it too would make a document read back
 * out of the editor differ from the one that went in when nothing was edited.
 */
export function withoutTransient(key: string, value: unknown): unknown {
  return TRANSIENT.has(key) && value ? undefined : value
}

/** A plain copy of some layouts, free of the store's proxies and of the editing flags. */
export function plainLayouts<T>(layouts: T): T {
  return JSON.parse(JSON.stringify(layouts, withoutTransient)) as T
}

/** Takes every set editing flag off every layer, in place. For a design on its way in. */
export function stripTransient(layouts: unknown): void {
  if (!Array.isArray(layouts)) return
  for (const layout of layouts) {
    const layers = (layout as { layers?: unknown })?.layers
    if (!Array.isArray(layers)) continue
    for (const layer of layers) {
      if (!layer || typeof layer !== 'object') continue
      for (const key of TRANSIENT_FIELDS) {
        if ((layer as Record<string, unknown>)[key]) delete (layer as Record<string, unknown>)[key]
      }
    }
  }
}
