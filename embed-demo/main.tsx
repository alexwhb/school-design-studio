import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error -- built bundle; typed through the source entry when consumed as a package
import { DesignStudio } from '../dist-embed/design-studio.js'
import '../dist-embed/design-studio.css'

function Host() {
  const [dark, setDark] = useState(false)

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  return (
    <div className="host-shell">
      <div className="host-bar">
        <h1>School Planner</h1>
        <ul>
          <li>Host list styling stays bulleted</li>
        </ul>
        <button className="host" onClick={toggle}>
          Host theme: {dark ? 'dark' : 'light'}
        </button>
      </div>
      <div className="host-body">
        <div className="editor-frame">
          <DesignStudio homeUrl="/" appName="Design Studio" />
        </div>
      </div>
    </div>
  )
}

createRoot(document.getElementById('host')!).render(
  <StrictMode>
    <Host />
  </StrictMode>,
)
