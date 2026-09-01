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
