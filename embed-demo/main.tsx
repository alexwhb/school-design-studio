/**
 * The host page, loaded the ordinary way: a static import of the component and
 * its stylesheet. `csp.tsx` beside this loads the same `Host` through a lazy
 * chunk and under the planner's Content-Security-Policy.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import Host from './Host'
import '../dist-embed/design-studio.css'

// One root, kept across hot reloads. Calling createRoot again on a container
// that already has one is an error React prints on every save.
const container = document.getElementById('host') as HTMLElement & { __root?: ReturnType<typeof createRoot> }
container.__root ??= createRoot(container)
container.__root.render(
  <StrictMode>
    <Host />
  </StrictMode>,
)
