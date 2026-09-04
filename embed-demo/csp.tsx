/**
 * The same host page, loaded the way the planner loads it.
 *
 * Two differences from `main.tsx`, both of which turned out to matter. The
 * component and its stylesheet arrive through a dynamic `import()` in a lazy
 * chunk rather than a static one, which is what a route-split React app does.
 * And `csp.html` carries the planner's Content-Security-Policy in a meta tag,
 * so anything the editor does that a policy can refuse — cloning into an
 * iframe, reading a canvas back, loading a font — is refused here too.
 *
 * Everything else is `main.tsx`; this file only changes how it is loaded.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

/** The stylesheet, as a URL so TypeScript is not asked what a CSS module is. */
const CSS_URL = '../dist-embed/design-studio.css'

async function start() {
  const [{ default: Host }] = await Promise.all([import('./Host'), import(/* @vite-ignore */ CSS_URL)])
  const container = document.getElementById('host') as HTMLElement & { __root?: ReturnType<typeof createRoot> }
  container.__root ??= createRoot(container)
  container.__root.render(
    <StrictMode>
      <Host />
    </StrictMode>,
  )
}

void start()
