import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error -- built bundle; typed through the source entry when consumed as a package
import { DesignStudio } from '../dist-embed/design-studio.js'
import '../dist-embed/design-studio.css'

/**
 * `?brand=1` stands in for a planner that keeps the school's brand kit itself:
 * it hands one in and holds on to every change the Brand panel reports, and the
 * editor never touches the browser's own copy. Off by default so the rest of
 * this page shows the ordinary case.
 */
const HOSTS_THE_KIT = new URLSearchParams(window.location.search).get('brand') === '1'

const HOST_KIT = {
  name: 'Riverbend Academy',
  shortName: 'Riverbend',
  tagline: 'Every child known',
  address: '9 Mill Lane, Riverbend',
  phone: '(555) 013-8800',
  email: 'office@riverbend.k12.us',
  website: 'riverbend.k12.us',
  colors: ['#7c3aedff'],
  fonts: {},
}

function Host() {
  const [dark, setDark] = useState(false)
  const [brand, setBrand] = useState(HOST_KIT)

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
          {HOSTS_THE_KIT ? <li id="host-school">{brand.name}</li> : null}
        </ul>
        <button className="host" onClick={toggle}>
          Host theme: {dark ? 'dark' : 'light'}
        </button>
      </div>
      <div className="host-body">
        <div className="editor-frame">
          {HOSTS_THE_KIT ? (
            <DesignStudio homeUrl="/" appName="Design Studio" brand={brand} onBrandChange={setBrand} />
          ) : (
            <DesignStudio homeUrl="/" appName="Design Studio" />
          )}
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
