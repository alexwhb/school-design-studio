import { useRef, useState } from 'react'
// @ts-expect-error -- built bundle; typed through the source entry when consumed as a package
import { DesignStudio } from '../dist-embed/design-studio.js'
// The compose entry, from the same build the planner's server would import.
import { composeDeck } from '../dist-embed/compose.js'

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
 *   ?readonly=1  the brand kit is shown but cannot be changed here
 *   ?kind=poster Letter portrait, poster templates, no presenter
 */
const params = new URLSearchParams(window.location.search)
const HOSTS_THE_KIT = params.get('brand') === '1'
const HOSTS_THE_DOC = params.get('doc') === '1'
const HAS_ASSISTANT = params.get('ai') === '1'
/** The school's brand, shown but not editable — what a non-administrator sees. */
const BRAND_LOCKED = params.get('readonly') === '1'
/** Left out entirely unless asked for, which is the standalone editor's case. */
const KIND = params.has('kind') ? (params.get('kind') === 'poster' ? 'poster' : 'slides') : undefined

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
/** Every importUrl call, so a test can see what the host was asked for. */
const imported: { url: string; meta: Record<string, unknown> }[] = []

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
    /**
     * Stands in for a planner taking its own copy of a stock photograph.
     *
     * A real one would fetch the bytes on the server and put them in the
     * school's file store; this only records what it was asked for and hands
     * back an address of its own, which is enough to show that the design ends
     * up pointing at the host rather than at Unsplash.
     */
    async importUrl(url: string, meta: Record<string, unknown>) {
      imported.push({ url, meta })
      ;(window as any).__imported = imported
      await new Promise((resolve) => setTimeout(resolve, 150))
      const item = {
        id: `host-import-${imported.length}`,
        url: `/covers/template-10${(imported.length % 9) + 1}.png`,
        width: Number(meta.width) || 1275,
        height: Number(meta.height) || 1650,
        name: String(meta.name || 'Stock photo'),
      }
      store = [item, ...store]
      return item
    },
  }
}

const HOST_UPLOADS = makeUploads()

/**
 * Markup the server's sanitiser and the browser's are held to agree on.
 *
 * `design-studio/compose` sanitises without a DOM and the editor sanitises with
 * one; they share the allowlist and the writer but not the parser. The e2e
 * suite runs both over this list and requires the answers to match.
 */
const MARKUP_CASES = ['<b>Open</b> House', '<strong>x</strong>', '<em>y</em>', '<u>u</u> <del>d</del>', '<span style="color:#ff0000">Red</span>', '<span style="color: rgb(255,0,0)">Red</span>', '<a href="https://school.org/trips">Trips</a>', '<a href="mailto:a@b.test">Mail</a>', '<a href="javascript:alert(1)">Go</a>', '<a href="//school.org">bare</a>', 'one<br>two', 'one<br>two<br>', '<p>one</p><p>two</p>', '<div>a</div><div>b</div>', '<b>unclosed', '</b>stray', '<img src=x onerror=alert(1)>', '<script>alert(1)</script>Hi', '<style>b{}</style>Hi', '<span onclick="alert(1)">Click</span>', '5 &lt; 6', 'a &amp; b', '&nbsp;gap', '<b><i>both</i></b>', '<b>a</b><b>b</b>', '<span style="font-weight:700">bold</span>', '<span style="text-decoration:underline">u</span>', '<font color="#00ff00">green</font>', '', '<br>', 'plain words', '<!--><img src=x onerror=alert(1)>-->safe', '<<SCRIPT>alert(1);//<</SCRIPT>', '<b>a<br>b</b>']

export default function Host() {
  const [dark, setDark] = useState(false)
  const [brand, setBrand] = useState(HOST_KIT)
  const [saved, setSaved] = useState('never')
  const [changes, setChanges] = useState(0)
  const studio = useRef<any>(null)
  // The e2e suite drives the host API the way the planner will — through the
  // ref, not the editor's DOM — so the ref has to be reachable from a test.
  ;(window as any).__studio = studio
  // The markup the two sanitisers are checked to agree on. Kept beside the ref
  // rather than in the spec so the browser test and the unit test read one list.
  ;(window as any).__markupCases = MARKUP_CASES

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
            {...(KIND ? { documentKind: KIND } : null)}
            {...(HOSTS_THE_KIT ? { brand, onBrandChange: setBrand } : null)}
            {...(BRAND_LOCKED ? { brandReadOnly: true } : null)}
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
