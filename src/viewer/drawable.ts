/**
 * A document as the viewer may draw it.
 *
 * The same field checks as every other way a design reaches the screen, and
 * every run of markup through the allowlist as well, since the pages are drawn
 * with `innerHTML` and the viewer is one more way in. The host that stores a
 * design runs the same allowlist, so on a design that came from one this
 * changes nothing; it is here for the one that did not.
 */
import { sanitizeFields } from '@/compose/fields'
import { sanitizeMarkup } from '@/compose/markup'
import type { DesignDocument, TdLayout } from '@/compose/types'

export function drawable(doc: DesignDocument): TdLayout[] {
  if (!doc || !Array.isArray(doc.layouts)) return []
  const { doc: safe } = sanitizeFields(doc)
  for (const layout of safe.layouts) {
    for (const layer of layout?.layers || []) {
      if (layer.type === 'w-text' && typeof layer.text === 'string') layer.text = sanitizeMarkup(layer.text, (layer as any).listStyle)
      const cells = (layer as any).cells
      if (layer.type === 'w-table' && Array.isArray(cells)) (layer as any).cells = cells.map((row: unknown) => (Array.isArray(row) ? row.map((cell) => sanitizeMarkup(String(cell ?? ''))) : row))
    }
  }
  return safe.layouts.filter((layout) => layout && layout.global)
}
