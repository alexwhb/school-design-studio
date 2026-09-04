/**
 * The six changes a host — or a model working for one — may make to a design.
 *
 * Deliberately small. A model that can move any widget by any number of pixels
 * will, and the result is a page nobody would print; a model that can only
 * change the words, swap a picture, and add, remove or reorder a page cannot
 * break a layout that was composed for it. The interesting work stays on this
 * side, in `deck.ts` and `poster.ts`.
 *
 * Nothing here throws. An op naming an id that is not on the page, or an index
 * off the end, comes back in `rejected` with the reason — a model handed an
 * exception learns nothing, and a half-applied batch is worse than a refused
 * one. Everything an op does not name is left exactly as it was.
 */
import type { DesignDocument, DesignOp, RejectedOp } from './types'
import { applyBrand, fieldFiller } from './brand'
import { composeSlide, blankSlide, DECK_PAGE_KINDS } from './deck'
import { composeSign, blankSign, SIGN_PAGE_KINDS } from './poster'
import { slideTheme, posterPack } from './themes'
import { kindOf } from './describe'
import { markup } from './widgets'
import { sanitizeMarkup } from './markup'
import type { TBrandKit } from '@/common/methods/brandKitCore'
import type { TdLayout, TdWidgetData } from '@/store/types'

/** The `kind` values `addPage` will take, for a design of this sort. */
export function pageKinds(kind: 'slides' | 'poster'): string[] {
  return kind === 'poster' ? [...SIGN_PAGE_KINDS] : [...DECK_PAGE_KINDS]
}

/** The editor's own ceiling, so a design composed here is one it will open. */
const MAX_PAGES = 50

function clone(doc: DesignDocument): DesignDocument {
  return JSON.parse(JSON.stringify(doc)) as DesignDocument
}

function findWidget(doc: DesignDocument, id: string): TdWidgetData | null {
  for (const layout of doc.layouts) {
    for (const layer of layout.layers) {
      if (String(layer.uuid) === String(id)) return layer
    }
  }
  return null
}

/**
 * Builds the page `addPage` asks for.
 *
 * `fields` is a flat map because that is what survives a model's JSON schema
 * without nesting: `title`, `sub`, `kicker`, `callout`, `notes`, `head`,
 * `eyebrow`, `badge`, `foot`, `icon`, and `bullets` as one string a line each.
 */
/** A freshly composed page carries `{{school.*}}`; a branded design fills them. */
function brandPage(layout: TdLayout, brand?: TBrandKit): TdLayout {
  if (!brand) return layout
  return applyBrand({ format: 'design-studio/v1', title: '', layouts: [layout] }, brand).layouts[0]
}

function buildPage(doc: DesignDocument, kind: string, fields: Record<string, string>, brand?: TBrandKit) {
  const bullets = String(fields.bullets || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((text) => ({ text, sub: [] as string[] }))

  if (kindOf(doc) === 'poster') {
    if (!SIGN_PAGE_KINDS.includes(kind as never)) return null
    const first = doc.layouts[0]?.global
    const size = { width: Number(first?.width) || 1275, height: Number(first?.height) || 1650 }
    const sign = {
      ...blankSign(kind as never),
      icon: fields.icon || null,
      eyebrow: fields.eyebrow || null,
      badge: fields.badge || null,
      head: fields.head || fields.title || '',
      sub: fields.sub || null,
      foot: fields.foot || null,
    }
    return brandPage(composeSign(sign, posterPack(fields.theme), size, fieldFiller(brand)), brand)
  }

  if (!DECK_PAGE_KINDS.includes(kind as never)) return null
  const slide = {
    ...blankSlide(kind as never),
    title: fields.title || fields.head || null,
    kicker: fields.kicker || fields.eyebrow || null,
    sub: fields.sub || null,
    callout: fields.callout || null,
    notes: fields.notes || null,
    bullets,
    columnHeads: [fields.columnHeadLeft || '', fields.columnHeadRight || ''].filter(Boolean),
    bulletsRight: String(fields.bulletsRight || '')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((text) => ({ text, sub: [] as string[] })),
  }
  return brandPage(composeSlide(slide, slideTheme(fields.theme), fieldFiller(brand)), brand)
}

export function applyOps(doc: DesignDocument, ops: DesignOp[], options: { brand?: TBrandKit } = {}): { doc: DesignDocument; rejected: RejectedOp[] } {
  let next = clone(doc)
  const rejected: RejectedOp[] = []
  const list = Array.isArray(ops) ? ops : []

  for (const op of list) {
    if (!op || typeof op !== 'object') {
      rejected.push({ op: op as DesignOp, reason: 'That is not an operation.' })
      continue
    }
    switch (op.op) {
      case 'setText': {
        const widget = findWidget(next, op.id)
        if (!widget) {
          rejected.push({ op, reason: `No widget with id ${op.id}.` })
          break
        }
        if (widget.type !== 'w-text') {
          rejected.push({ op, reason: `Widget ${op.id} is a ${widget.type}, which holds no text.` })
          break
        }
        // Always escaped, never sniffed. This text comes from a model, and
        // through a model from whatever a person typed at it, so a version that
        // guessed "this looks like markup, pass it through" would be a version
        // that stores `<img src=x onerror=…>` and renders it in every
        // colleague's browser. A host that genuinely holds markup says so with
        // `setMarkup`, which is a different word for a different thing.
        widget.text = markup(op.text)
        break
      }

      case 'setMarkup': {
        const widget = findWidget(next, op.id)
        if (!widget) {
          rejected.push({ op, reason: `No widget with id ${op.id}.` })
          break
        }
        if (widget.type !== 'w-text') {
          rejected.push({ op, reason: `Widget ${op.id} is a ${widget.type}, which holds no text.` })
          break
        }
        widget.text = sanitizeMarkup(String(op.html ?? ''), widget.listStyle as never)
        break
      }

      case 'setImage': {
        const widget = findWidget(next, op.id)
        if (!widget) {
          rejected.push({ op, reason: `No widget with id ${op.id}.` })
          break
        }
        if (widget.type !== 'w-image') {
          rejected.push({ op, reason: `Widget ${op.id} is a ${widget.type}, which holds no picture.` })
          break
        }
        if (!op.url) {
          rejected.push({ op, reason: 'A picture needs a url.' })
          break
        }
        // The frame stays where the layout put it and the picture is re-cropped
        // to fill it, so swapping a portrait for a landscape does not leave a
        // hole or push anything sideways.
        const slot = widget.width / widget.height
        const picture = op.width && op.height ? op.width / op.height : slot
        widget.imgUrl = op.url
        const zoom = picture > slot ? picture / slot : 1
        const zoomY = picture < slot ? slot / picture : 1
        ;(widget as any).zoom = zoom
        ;(widget as any).zoomY = zoomY
        widget.transform = ` scale(${zoom}, ${zoomY}) translate(0px, 0px)`
        break
      }

      case 'addPage': {
        if (next.layouts.length >= MAX_PAGES) {
          rejected.push({ op, reason: `A design holds at most ${MAX_PAGES} pages.` })
          break
        }
        const at = Number(op.after)
        if (!Number.isInteger(at) || at < -1 || at > next.layouts.length - 1) {
          rejected.push({ op, reason: `There is no page ${op.after} to add after.` })
          break
        }
        const built = buildPage(next, String(op.kind), op.fields || {}, options.brand)
        if (!built) {
          rejected.push({ op, reason: `“${op.kind}” is not a page this design can hold. Try one of: ${pageKinds(kindOf(next) === 'poster' ? 'poster' : 'slides').join(', ')}.` })
          break
        }
        next.layouts.splice(at + 1, 0, built)
        break
      }

      case 'removePage': {
        const index = Number(op.index)
        if (!Number.isInteger(index) || index < 0 || index >= next.layouts.length) {
          rejected.push({ op, reason: `There is no page ${op.index}.` })
          break
        }
        if (next.layouts.length === 1) {
          rejected.push({ op, reason: 'A design has to keep one page.' })
          break
        }
        next.layouts.splice(index, 1)
        break
      }

      case 'movePage': {
        const from = Number(op.from)
        const to = Number(op.to)
        if (!Number.isInteger(from) || from < 0 || from >= next.layouts.length) {
          rejected.push({ op, reason: `There is no page ${op.from}.` })
          break
        }
        if (!Number.isInteger(to) || to < 0 || to >= next.layouts.length) {
          rejected.push({ op, reason: `Page ${op.from} cannot go to ${op.to}; there are ${next.layouts.length} pages.` })
          break
        }
        const [moved] = next.layouts.splice(from, 1)
        next.layouts.splice(to, 0, moved)
        break
      }

      case 'applyBrand': {
        if (!options.brand) {
          rejected.push({ op, reason: 'No brand kit was given to apply.' })
          break
        }
        next = applyBrand(next, options.brand)
        break
      }

      default:
        rejected.push({ op, reason: `“${(op as { op?: string }).op}” is not an operation.` })
    }
  }

  return { doc: next, rejected }
}
