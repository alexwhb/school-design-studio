import { StrictMode, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
// @ts-expect-error -- built bundle; typed through the source entry when consumed as a package
import { DesignStudio } from '../dist-embed/design-studio.js'
// The compose entry, from the same build the planner's server would import.
import { composeDeck } from '../dist-embed/compose.js'
import '../dist-embed/design-studio.css'

/**
 * A stand-in for the planner.
 *
 * Everything the editor lets a host take over, taken over: the brand kit, the
 * design, the file store, and a panel of the host's own. Its job is to be the
 * awkward host — its own reset, its own list styling, its own dark mode — so
 * that anything the editor leaks is visible, and to be somewhere the host API
 * can actually be driven rather than only described.
 *
 * Query string, so one page covers every shape:
 *
 *   ?brand=1     the host keeps the school's brand kit
 *   ?doc=1       the host keeps the design, with Save and the restore offer off
 *   ?ai=1        the host supplies the AI panel
 *   ?kind=poster Letter portrait, poster templates, no presenter
 */
const params = new URLSearchParams(window.location.search)
const HOSTS_THE_KIT = params.get('brand') === '1'
const HOSTS_THE_DOC = params.get('doc') === '1'
const HAS_ASSISTANT = params.get('ai') === '1'
const KIND = params.get('kind') === 'poster' ? 'poster' : 'slides'

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

/** The design the host is holding, composed the way the planner's server would. */
const HOST_DOC = composeDeck(
  {
    title: 'Open House 2026',
    slides: [
      {
        layout: 'title',
        title: 'Open House',
        kicker: 'Riverbend Academy',
        sub: 'Thursday 14 May, from six o’clock, in the main hall',
        bullets: [],
        bulletsRight: [],
        columnHeads: [],
        callout: null,
        notes: 'Thank the PTA before anything else.',
        image: null,
      },
      {
        layout: 'content',
        title: 'What is on',
        kicker: 'The evening',
        sub: null,
        bullets: [
          { text: 'Classroom tours from six', sub: [] },
          { text: 'Music in the hall at seven', sub: [] },
          { text: 'Refreshments throughout', sub: [] },
        ],
        bulletsRight: [],
        columnHeads: [],
        callout: null,
        notes: null,
        image: null,
      },
    ],
  },
  { brand: HOST_KIT },
)

/**
 * A file store that is not IndexedDB, kept in memory. Enough to show that the
 * Uploads section reads and writes the host's rather than the browser's.
 */
function makeUploads() {
  let store: { id: string; url: string; width: number; height: number; name: string }[] = [{ id: 'host-1', url: '/covers/template-101.png', width: 1275, height: 1650, name: 'Field Day poster.png' }]
  return {
    async list() {
      return store.slice()
    },
    async upload(file: File) {
      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.readAsDataURL(file)
      })
      const item = { id: `host-${store.length + 1}`, url, width: 800, height: 600, name: file.name || 'Upload' }
      store = [item, ...store]
      return item
    },
    async remove(id: string) {
      store = store.filter((item) => item.id !== id)
    },
  }
}

const HOST_UPLOADS = makeUploads()

function Host() {
  const [dark, setDark] = useState(false)
  const [brand, setBrand] = useState(HOST_KIT)
  const [saved, setSaved] = useState('never')
  const [changes, setChanges] = useState(0)
  const studio = useRef<any>(null)
  // The e2e suite drives the host API the way the planner will — through the
  // ref, not the editor's DOM — so the ref has to be reachable from a test.
  ;(window as any).__studio = studio

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
  }

  /** Stands in for a POST. Slow enough that the pill's "Saving…" is visible. */
  async function save(doc: any) {
    await new Promise((resolve) => setTimeout(resolve, 400))
    ;(window as any).__lastSaved = doc
    setSaved(`${doc.layouts.length} page${doc.layouts.length === 1 ? '' : 's'} at ${new Date().toLocaleTimeString()}`)
  }

  /** What the host's panel does: change the deck through the ref, not the DOM. */
  function setHeading() {
    const doc = studio.current?.getDocument()
    const page = doc?.layouts?.[0]
    const heading = page?.layers?.find((layer: any) => layer.brandRole === 'heading')
    if (!heading) return
    studio.current.applyOps([{ op: 'setText', id: heading.uuid, text: 'Spring Open House' }])
  }

  async function downloadPdf() {
    const blob = await studio.current.exportPdf()
    ;(window as any).__lastPdf = { type: blob.type, size: blob.size }
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'design.pdf'
    link.click()
    URL.revokeObjectURL(url)
  }

  const assistant = (
    <div className="assistant">
      <p>Ask for a draft, or change what is on the page.</p>
      <button id="assistant-heading" className="host" onClick={setHeading}>
        Rewrite the heading
      </button>
      <p className="assistant__note">The host talks to the editor through its ref, never its DOM.</p>
    </div>
  )

  return (
    <div className="host-shell">
      <div className="host-bar">
        <h1>School Planner</h1>
        <ul>
          <li>Host list styling stays bulleted</li>
          {HOSTS_THE_KIT ? <li id="host-school">{brand.name}</li> : null}
          {HOSTS_THE_DOC ? <li id="host-saved">Saved: {saved}</li> : null}
          {HOSTS_THE_DOC ? <li id="host-changes">Changes seen: {changes}</li> : null}
        </ul>
        {HOSTS_THE_DOC ? (
          <button id="host-pdf" className="host" onClick={() => void downloadPdf()}>
            Download PDF
          </button>
        ) : null}
        <button className="host" onClick={toggle}>
          Host theme: {dark ? 'dark' : 'light'}
        </button>
      </div>
      <div className="host-body">
        <div className="editor-frame">
          <DesignStudio
            ref={studio}
            homeUrl="/"
            appName="Design Studio"
            documentKind={KIND}
            {...(HOSTS_THE_KIT ? { brand, onBrandChange: setBrand } : null)}
            {...(HOSTS_THE_DOC
              ? {
                  document: HOST_DOC,
                  onSave: save,
                  saveLabel: 'Save to planner',
                  onDocumentChange: () => setChanges((count) => count + 1),
                  uploads: HOST_UPLOADS,
                }
              : null)}
            {...(HAS_ASSISTANT ? { assistant } : null)}
          />
        </div>
      </div>
    </div>
  )
}

// The ref is handed out before the editor mounts, so a host holding it from its
// first render can still be given one that works. Kept on `window` for the e2e
// suite, which drives the host API the way the planner will.
createRoot(document.getElementById('host')!).render(
  <StrictMode>
    <Host />
  </StrictMode>,
)
