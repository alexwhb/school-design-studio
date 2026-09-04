import { describe, expect, it } from 'vitest'
import { applyOps, composeDeck, describeDocument, markupToText, sanitizeMarkup, type DesignDocument } from '@/compose'

/** A one-page deck with one text widget, and that widget's id. */
function page(): { doc: DesignDocument; id: string } {
  const doc = composeDeck({
    title: 'x',
    slides: [{ layout: 'title', title: 'Open House', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }],
  })
  const id = describeDocument(doc).pages[0].texts.find((text) => text.role === 'heading')!.id
  return { doc, id }
}

const textOf = (doc: DesignDocument, id: string) => String(doc.layouts[0].layers.find((layer) => layer.uuid === id)!.text)

describe('sanitizeMarkup', () => {
  it('keeps the formatting a design is allowed to hold', () => {
    expect(sanitizeMarkup('<b>Open</b> House')).toBe('<b>Open</b> House')
    expect(sanitizeMarkup('<strong>Open</strong>')).toBe('<b>Open</b>')
    expect(sanitizeMarkup('<em>soon</em>')).toBe('<i>soon</i>')
    expect(sanitizeMarkup('<u>note</u> and <del>gone</del>')).toBe('<u>note</u> and <s>gone</s>')
    expect(sanitizeMarkup('<span style="color: #ff0000">Red</span>')).toBe('<span style="color:#ff0000">Red</span>')
    expect(sanitizeMarkup('<span style="color: rgb(255, 0, 0)">Red</span>')).toBe('<span style="color:#ff0000">Red</span>')
    expect(sanitizeMarkup('<a href="https://school.org/trips">Trips</a>')).toBe('<a href="https://school.org/trips">Trips</a>')
    expect(sanitizeMarkup('<a href="mailto:office@school.org">Email</a>')).toBe('<a href="mailto:office@school.org">Email</a>')
    expect(sanitizeMarkup('one<br>two')).toBe('one<br>two')
  })

  it('drops a script and everything in it', () => {
    expect(sanitizeMarkup('<script>alert(1)</script>Hello')).toBe('Hello')
    // The tokeniser has to read a script as text, or the `<` inside it starts
    // an element and the tags after it nest somewhere unexpected.
    expect(sanitizeMarkup('<script>if (a<b) alert("<b>")</script>Safe')).toBe('Safe')
    expect(sanitizeMarkup('<style>body{display:none}</style>Hello')).toBe('Hello')
  })

  it('takes the words out of an element nobody listed, and nothing else', () => {
    expect(sanitizeMarkup('<img src=x onerror=alert(1)>')).toBe('')
    expect(sanitizeMarkup('<img src=x onerror="alert(1)">Caption')).toBe('Caption')
    expect(sanitizeMarkup('<span onclick="alert(1)">Click</span>')).toBe('Click')
    expect(sanitizeMarkup('<b onmouseover="alert(1)">Bold</b>')).toBe('<b>Bold</b>')
    expect(sanitizeMarkup('<iframe src="https://evil.test"></iframe>done')).toBe('done')
    expect(sanitizeMarkup('<svg><animate onbegin=alert(1)>hi</svg>')).toBe('hi')
    expect(sanitizeMarkup('<form><button formaction="javascript:alert(1)">Go</button></form>')).toBe('Go')
  })

  it('refuses a link that is not a link', () => {
    expect(sanitizeMarkup('<a href="javascript:alert(1)">Go</a>')).toBe('Go')
    expect(sanitizeMarkup('<a href="JaVaScRiPt:alert(1)">Go</a>')).toBe('Go')
    expect(sanitizeMarkup('<a href="data:text/html,<script>alert(1)</script>">Go</a>')).toBe('Go')
    expect(sanitizeMarkup('<a href="vbscript:msgbox(1)">Go</a>')).toBe('Go')
  })

  it('cannot be steered by a comment, a doctype or a stray bracket', () => {
    // `<!-->` closes a comment in some parsers and not others; either way the
    // element after it must not come out as an element.
    expect(sanitizeMarkup('<!--><img src=x onerror=alert(1)>-->safe')).not.toContain('<img')
    expect(sanitizeMarkup('<!doctype html><b>Bold</b>')).toBe('<b>Bold</b>')
    expect(sanitizeMarkup('5 < 6 and 7 > 2')).toBe('5 &lt; 6 and 7 &gt; 2')
    expect(sanitizeMarkup('<not a tag')).toBe('&lt;not a tag')
  })

  it('never lets an angle bracket through as one', () => {
    const nasty = ['<img src=x onerror=alert(1)>', '"><script>alert(1)</script>', "<a href='javascript:alert(1)'>x</a>", '<div style="background:url(javascript:alert(1))">x</div>', '<b><script>alert(1)</script></b>', '<SCRIPT SRC=//evil.test/x.js></SCRIPT>', '<<SCRIPT>alert(1);//<</SCRIPT>', '<img src="x" onerror="alert(1)" />']
    for (const input of nasty) {
      const out = sanitizeMarkup(input)
      expect(out, input).not.toMatch(/<(script|img|iframe|svg|object|embed|form)\b/i)
      expect(out.toLowerCase(), input).not.toContain('javascript:')
      expect(out.toLowerCase(), input).not.toContain('onerror')
    }
  })

  it('is idempotent, so storing a design twice does not change it', () => {
    for (const input of ['<b>Open</b> <a href="https://school.org">House</a>', 'one<br>two<br>', '<ul><li>one</li><li>two</li></ul>', '<img src=x onerror=alert(1)>after']) {
      const once = sanitizeMarkup(input)
      expect(sanitizeMarkup(once), input).toBe(once)
    }
  })

  it('reads the words out of markup for anything that wants them plain', () => {
    expect(markupToText('<b>Open</b> House<br>Thursday')).toBe('Open House\nThursday')
    expect(markupToText('<script>alert(1)</script>Hello &amp; welcome')).toBe('Hello & welcome')
  })
})

/**
 * The cases the browser and the server are checked to agree on.
 *
 * `sanitizeMarkup` is the single description of what markup a design may hold,
 * and the planner calls it on the server while the editor sanitises the same
 * string in a browser. They share the writer and the allowlist; what they do
 * not share is the parser, so this list is what keeps the two readers honest.
 * It is asserted here against known answers, and in the e2e suite against the
 * browser's own DOM reader over the same inputs.
 */
export const AGREEMENT_CASES = ['<b>Open</b> House', '<strong>x</strong>', '<em>y</em>', '<u>u</u> <del>d</del>', '<span style="color:#ff0000">Red</span>', '<span style="color: rgb(255,0,0)">Red</span>', '<a href="https://school.org/trips">Trips</a>', '<a href="mailto:a@b.test">Mail</a>', '<a href="javascript:alert(1)">Go</a>', '<a href="//school.org">bare</a>', 'one<br>two', 'one<br>two<br>', '<p>one</p><p>two</p>', '<div>a</div><div>b</div>', '<b>unclosed', '</b>stray', '<img src=x onerror=alert(1)>', '<script>alert(1)</script>Hi', '<style>b{}</style>Hi', '<span onclick="alert(1)">Click</span>', '5 &lt; 6', 'a &amp; b', '&nbsp;gap', '<b><i>both</i></b>', '<b>a</b><b>b</b>', '<span style="font-weight:700">bold</span>', '<span style="text-decoration:underline">u</span>', '<font color="#00ff00">green</font>', '', '<br>', 'plain words', '<!--><img src=x onerror=alert(1)>-->safe', '<<SCRIPT>alert(1);//<</SCRIPT>', '<b>a<br>b</b>']

describe('agreeing with the browser', () => {
  it('reads a comment that closes as soon as it opens the way a browser does', () => {
    // `<!-->` is an abrupt closing of an empty comment, so what follows is
    // markup rather than more comment. A tokeniser that swallowed to the next
    // `-->` would disagree with the browser about where the markup starts,
    // which is exactly the disagreement a payload is smuggled through.
    expect(sanitizeMarkup('<!--><img src=x onerror=alert(1)>-->safe')).toBe('--&gt;safe')
    expect(sanitizeMarkup('<!---><b>bold</b>')).toBe('<b>bold</b>')
    expect(sanitizeMarkup('<!-- a real comment --><b>bold</b>')).toBe('<b>bold</b>')
  })

  it('has an answer for every case the browser is checked against', () => {
    // The e2e suite runs this same list through the editor's DOM sanitiser and
    // requires the two to match character for character. Here it only has to
    // not throw and to be stable — a case that is not idempotent would make
    // that comparison meaningless.
    for (const input of AGREEMENT_CASES) {
      const once = sanitizeMarkup(input)
      expect(sanitizeMarkup(once), input).toBe(once)
    }
  })
})

describe('setText and setMarkup', () => {
  it('setText escapes, always, whatever it looks like', () => {
    const { doc, id } = page()
    const attack = '<img src=x onerror=alert(document.cookie)>'
    const { doc: after, rejected } = applyOps(doc, [{ op: 'setText', id, text: attack }])
    expect(rejected).toEqual([])
    expect(textOf(after, id)).toBe('&lt;img src=x onerror=alert(document.cookie)&gt;')
    // And it reads back as the characters somebody typed.
    expect(describeDocument(after).pages[0].texts.find((text) => text.id === id)?.text).toBe(attack)
  })

  it('setText escapes markup a host might have meant', () => {
    const { doc, id } = page()
    const { doc: after } = applyOps(doc, [{ op: 'setText', id, text: '<b>Open House</b>' }])
    expect(textOf(after, id)).toBe('&lt;b&gt;Open House&lt;/b&gt;')
  })

  it('setText keeps line breaks as line breaks', () => {
    const { doc, id } = page()
    const { doc: after } = applyOps(doc, [{ op: 'setText', id, text: 'Thursday\n14 May' }])
    expect(textOf(after, id)).toBe('Thursday<br/>14 May')
  })

  it('setMarkup keeps the formatting and drops the rest', () => {
    const { doc, id } = page()
    const { doc: after, rejected } = applyOps(doc, [{ op: 'setMarkup', id, html: '<b>Open</b> <img src=x onerror=alert(1)><a href="javascript:alert(1)">House</a>' }])
    expect(rejected).toEqual([])
    expect(textOf(after, id)).toBe('<b>Open</b> House')
  })

  it('setMarkup round-trips the editor’s own output', () => {
    const { doc, id } = page()
    const held = '<b>Open</b> <a href="https://school.org">House</a>'
    const { doc: after } = applyOps(doc, [{ op: 'setMarkup', id, html: held }])
    expect(textOf(after, id)).toBe(held)
  })

  it('refuses either on a widget that holds no text', () => {
    const doc = composeDeck({
      title: 'x',
      slides: [{ layout: 'media', title: 'Photo', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: { url: 'data:image/gif;base64,R0lGODlhAQABAAAAACw=', width: 10, height: 10 } }],
    })
    const image = describeDocument(doc).pages[0].images[0].id
    const { rejected } = applyOps(doc, [
      { op: 'setText', id: image, text: 'hello' },
      { op: 'setMarkup', id: image, html: '<b>hello</b>' },
    ])
    expect(rejected).toHaveLength(2)
    expect(rejected[1].reason).toContain('holds no text')
  })
})
