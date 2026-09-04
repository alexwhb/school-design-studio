/**
 * What a model is shown of a design it is being asked to change.
 *
 * Text and ids and nothing else. A page carrying a photograph is a megabyte of
 * base64 that says nothing about what the page means, and a page's geometry is
 * not something a model should be reasoning about — it has a layout engine on
 * this side of the wire and it is this module's neighbours. So each page comes
 * back as its words, in reading order, each with the id that `setText` takes.
 *
 * The `role` is the one hint about what a box is *for*: the merge field it
 * holds, or the part it was composed to play. Without it a model shown eleven
 * strings has to guess which is the heading, and it guesses by length.
 */
import type { DesignDocument, DesignKind, DocumentView } from './types'
import { SLIDE_PAGE, POSTER_PAGE } from './types'
import { fieldsInText, plainFromMarkup } from '@/utils/mergeFieldsCore'
import { isBrandField } from '@/common/methods/brandKitCore'
import type { TdWidgetData } from '@/store/types'

/**
 * What one text box is for.
 *
 * A merge field wins — a box holding `{{school.name}}` is the school's name
 * wherever it sits — then the label the composer wrote on it, then the role a
 * template gave it. A box that answers to none of those has no role, which is
 * an honest answer and better than a guess.
 */
function roleOf(layer: TdWidgetData): string | null {
  const fields = fieldsInText(layer.text)
  const brandField = fields.find((name) => isBrandField(name))
  if (brandField) return brandField.split('|')[0].trim().toLowerCase()
  if (fields.length) return fields[0].trim().toLowerCase()
  if (layer.label) return String(layer.label)
  if (layer.brandRole && layer.brandRole !== 'keep') return layer.brandRole
  return null
}

/** A picture's own description, when it has one worth showing. Never its bytes. */
function altOf(layer: TdWidgetData): string | null {
  const label = layer.label || (layer as any).alt
  return label ? String(label) : null
}

/**
 * Which kind a stored design is, read back off its first page rather than
 * stored — a document that has been resized is what it now measures.
 */
export function kindOf(doc: DesignDocument): DesignKind | 'unknown' {
  const first = doc?.layouts?.[0]?.global
  if (!first) return 'unknown'
  const wide = Number(first.width) >= Number(first.height)
  if (wide && Math.abs(Number(first.width) / Number(first.height) - SLIDE_PAGE.width / SLIDE_PAGE.height) < 0.06) return 'slides'
  if (!wide && Math.abs(Number(first.width) / Number(first.height) - POSTER_PAGE.width / POSTER_PAGE.height) < 0.25) return 'poster'
  return wide ? 'slides' : 'poster'
}

export function describeDocument(doc: DesignDocument): DocumentView {
  const layouts = Array.isArray(doc?.layouts) ? doc.layouts : []
  return {
    title: String(doc?.title || ''),
    kind: kindOf(doc),
    pages: layouts.map((layout, index) => {
      const layers = Array.isArray(layout?.layers) ? layout.layers : []
      const notes = typeof layout?.global?.notes === 'string' ? layout.global.notes.trim() : ''
      return {
        index,
        width: Number(layout?.global?.width) || 0,
        height: Number(layout?.global?.height) || 0,
        texts: layers
          .filter((layer) => layer.type === 'w-text' && !layer.hidden)
          .map((layer) => ({ id: String(layer.uuid), role: roleOf(layer), text: plainFromMarkup(layer.text) }))
          .filter((entry) => entry.text.length > 0),
        images: layers.filter((layer) => layer.type === 'w-image' && !layer.hidden).map((layer) => ({ id: String(layer.uuid), alt: altOf(layer) })),
        notes: notes || null,
      }
    }),
  }
}
