/**
 * A template from the gallery onto the design, as one step of undo.
 *
 * The gallery used to clear the page the moment a card was clicked and fill it
 * once the template's file arrived. The undo step closes a moment after the
 * click, and in production the file takes longer than that to come back, so
 * the step recorded was "the page was cleared" and the template landed outside
 * any step at all. One Ctrl+Z then put the old widgets back on top of the
 * template's, and the page was a mix of both that no press of undo could
 * separate. Nothing here touches the page until the template is in hand, and
 * then everything it does is one `recordHistory`.
 *
 * Two ways in. `replace` puts the template where the page on screen was; `add`
 * puts it after that page as a new one and leaves the page alone. A template of
 * several pages lands as several pages either way, the first of them in the
 * place of the page on screen when replacing.
 */
import { recordHistory } from '@/common/hooks/history'
import type { TTemplateBrand } from '@/common/methods/brandKitCore'
import { MAX_PAGES } from '@/compose/types'
import { canvasState, widgetState } from '../state'
import { setDPage } from '../canvas'
import type { TdLayout, TdWidgetData, TPageState } from '../types'
import { copyLayout, showPage } from './pages'
import { setTemplate } from './template'
import { setDWidgets } from './widget'

export type LoadedTemplate = {
  pages: TdLayout[]
  brand?: TTemplateBrand
  title: string
}

export type TemplateMode = 'replace' | 'add'

/**
 * A template file's `data` as pages. Two shapes are about: a list of layouts,
 * which is what the editor saves, and the older `{ page, widgets }`.
 */
export function templatePages(data: unknown): TdLayout[] {
  if (Array.isArray(data)) return data.filter((layout) => layout && layout.global).map((layout) => ({ global: layout.global, layers: Array.isArray(layout.layers) ? layout.layers : [] }))
  const old = data as { page?: TPageState; widgets?: TdWidgetData[] } | null
  if (old && old.page) return [{ global: old.page, layers: Array.isArray(old.widgets) ? old.widgets : [] }]
  return []
}

/** Whether the page on screen holds anything a template would throw away. */
export function pageHasContent(): boolean {
  return widgetState.dWidgets.some((layer) => !layer.hidden)
}

/** Whether `add` has room for this many more pages. */
export function roomFor(pages: number): boolean {
  return widgetState.dLayouts.length + pages <= MAX_PAGES
}

/**
 * The template onto the design. False when there was nothing to put there, or
 * no room for it as new pages; nothing has changed in either case.
 */
export function applyTemplate(template: LoadedTemplate, mode: TemplateMode): boolean {
  if (!template.pages.length) return false
  const extra = mode === 'add' ? template.pages.length : template.pages.length - 1
  if (!roomFor(extra)) return false

  recordHistory(() => {
    const start = mode === 'add' ? canvasState.dCurrentPage + 1 : canvasState.dCurrentPage
    template.pages.forEach((source, offset) => {
      // Fresh ids for every widget, and the group links rewritten to match.
      // The gallery's files carry fixed ids, so the same template on two pages
      // was two pages fighting over one selection.
      const layout = copyLayout(source)
      const index = start + offset
      if (mode === 'add' || offset > 0) widgetState.dLayouts.splice(index, 0, { global: layout.global, layers: [] })
      showPage(index)
      // The page, then the layers, in that order: the kit is put onto the
      // layers against the page they will sit on. See `setTemplate`.
      setDPage(layout.global)
      setDWidgets([])
      setTemplate(layout.layers, template.brand)
    })
    showPage(start)
  })
  return true
}
