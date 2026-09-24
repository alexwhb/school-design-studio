/**
 * A host page showing a design the way the planner does on a narrow screen:
 * `DesignViewer` from `design-studio/viewer`, not the editor, loaded from the
 * built package. `?sign=1` shows a poster instead of a deck.
 *
 * The page it scrolls in is the host's, so the viewer is dropped into an
 * ordinary column with a heading above it, and the page it is on is echoed
 * into `#host-page` so a test can see `onPageChange` arrive.
 */
import { StrictMode, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { DesignViewer } from '../dist-embed/viewer.js'
import { composeDeck, composePoster } from '../dist-embed/compose.js'
import '../dist-embed/design-studio.css'

const slide = (over: Record<string, unknown>) => ({ layout: 'content', title: null, kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null, ...over })

// With a kit, as the planner composes them, so the school's name is filled in.
const KIT = { name: 'Riverbend Academy', shortName: 'Riverbend', tagline: '', address: '', phone: '(555) 013-8800', email: '', website: '', colors: ['#7c3aedff'], fonts: {} }

const DECK = composeDeck(
  {
    title: 'Open House 2026',
    slides: [
      slide({ layout: 'title', title: 'Open House', kicker: 'Riverbend Academy', sub: 'Thursday 14 May, from six o’clock, in the main hall' }),
      slide({
        title: 'What is on',
        kicker: 'The evening',
        bullets: [
          { text: 'Classroom tours from six', sub: [] },
          { text: 'Music in the hall at seven', sub: [] },
          { text: 'Refreshments throughout', sub: [] },
        ],
      }),
      slide({ layout: 'media', title: 'The new library', sub: 'Open every lunchtime', image: { url: '/covers/template-101.png', width: 600, height: 776, alt: 'The book fair poster' }, bullets: [{ text: 'Two thousand new books', sub: [] }] }),
      slide({ layout: 'statement', title: 'Everyone is welcome', sub: 'Bring a friend' }),
    ],
  } as never,
  { brand: KIT },
)

const SIGN = composePoster({ orientation: 'PORTRAIT', size: 'letter', signs: [{ layout: 'direction', icon: null, eyebrow: 'This way', badge: null, head: 'Gymnasium', sub: 'Past the library', foot: null }] } as never, { brand: KIT })

function Host() {
  const [page, setPage] = useState(0)
  const doc = new URLSearchParams(location.search).get('sign') ? SIGN : DECK
  return (
    // Room under the last page, so it can be scrolled to the middle of the screen.
    <main style={{ padding: '12px 12px 60vh', maxWidth: 720, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, margin: '4px 0 8px' }}>{doc.title}</h1>
      <p id="host-page">{page}</p>
      <DesignViewer document={doc} onPageChange={setPage} />
    </main>
  )
}

createRoot(document.getElementById('host')!).render(
  <StrictMode>
    <Host />
  </StrictMode>,
)
