let root: HTMLElement | null = null

export function setAppRoot(element: HTMLElement | null) {
  root = element
}

/**
 * The element the editor treats as its own page: `#app` when it owns the tab,
 * or the container it was mounted into when it is embedded in another app.
 */
export function getAppRoot(): HTMLElement | null {
  if (root && root.isConnected) return root
  return document.getElementById('app') || document.querySelector('.ds-root')
}

/**
 * Where menus, tooltips and toasts are rendered. Standalone that is the body,
 * which is where they have always gone. Embedded it has to be the editor's own
 * root, because the embed build scopes every rule under it — anything portalled
 * to the body would come out unstyled.
 */
export function getPortalContainer(): HTMLElement | undefined {
  if (root && root.isConnected) return root
  return undefined
}

const FIELDS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

function asElement(target: EventTarget | null | undefined): Element | null {
  if (!target || typeof Node === 'undefined' || !(target instanceof Node)) return null
  return target instanceof Element ? target : target.parentElement
}

/**
 * Whether a key pressed with focus on `target` is the editor's to answer.
 *
 * The shortcuts listen on the document, because focus in a design tool is
 * mostly nowhere in particular: clicking the page leaves it on the body. But
 * embedded, the document is the host's too, and they used to answer for all of
 * it — Backspace on one of the planner's buttons deleted the selected widget,
 * the arrow keys in its menus nudged it, a typeahead letter armed a drawing
 * tool, and Ctrl+A/C/V/Z in its own text fields went to the design.
 *
 * So a key counts when focus is inside the editor's root, or when it is on the
 * body or the root element, where it lands after a click on the canvas. A
 * form field or a contentEditable outside the root is the host's, and so is
 * anything else outside it. Standalone the editor is the whole page and the
 * root test passes for everything.
 *
 * Fields inside the editor — the design's name, the speaker notes — are still
 * fields and take their own keys; `isFieldTarget` is how the caller tells.
 */
export function isEditorKeyTarget(target: EventTarget | null | undefined): boolean {
  if (typeof document === 'undefined') return false
  if (target === document || target === document.body || target === document.documentElement || target === window) return true
  const el = asElement(target)
  if (!el) return false
  const embedded = getPortalContainer()
  return embedded ? embedded.contains(el) : true
}

/**
 * Whether a pointer event on `target` happened in the editor.
 *
 * Stricter than the key test: a press on the host's own page lands on its
 * body as readily as on one of its elements, and is not the editor's either
 * way.
 */
export function isEditorPointerTarget(target: EventTarget | null | undefined): boolean {
  const el = asElement(target)
  if (!el) return false
  const embedded = getPortalContainer()
  return embedded ? embedded.contains(el) : true
}

/** A form field, or text somebody can type into, which takes its own keys. */
export function isFieldTarget(target: EventTarget | null | undefined): boolean {
  const el = asElement(target)
  if (!el) return false
  return FIELDS.has(el.nodeName) || !!(el as HTMLElement).isContentEditable
}
