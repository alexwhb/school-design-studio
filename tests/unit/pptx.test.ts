/**
 * Opening a PowerPoint file.
 *
 * Two halves. The first builds the XML by hand, one part at a time, so that a
 * failure names the thing that broke rather than "the deck came out wrong" —
 * theme colours, the colour map, groups, tables, notes, the shapes that have to
 * be refused. The second takes the exporter this repo already ships, writes a
 * real .pptx with it, and reads it back: the two are meant to be inverses, and
 * nothing else proves they still are against a file PowerPoint itself would
 * accept.
 */
import JSZip from 'jszip'
import { describe, expect, it } from 'vitest'
import { importPptx, pptxMediaPaths, type PptxMedia, type PptxParts } from '@/compose/pptx/import'
import { nearestFont } from '@/compose/pptx/style'
import { child, children, decodeEntities, find, num, parseXml } from '@/compose/pptx/xml'

// ---- the smallest package that is still a presentation -----------------------

const SLIDE_CX = 12192000
const SLIDE_CY = 6858000
/** One inch, in EMU. At 96 px/inch and a 1.5x page scale that is 144 design px. */
const INCH = 914400

const THEME = `<?xml version="1.0"?>
<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <a:themeElements>
    <a:clrScheme name="Office">
      <a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>
      <a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>
      <a:dk2><a:srgbClr val="44546A"/></a:dk2>
      <a:lt2><a:srgbClr val="E7E6E6"/></a:lt2>
      <a:accent1><a:srgbClr val="4472C4"/></a:accent1>
      <a:accent2><a:srgbClr val="ED7D31"/></a:accent2>
    </a:clrScheme>
    <a:fontScheme name="Office">
      <a:majorFont><a:latin typeface="Georgia"/></a:majorFont>
      <a:minorFont><a:latin typeface="Calibri"/></a:minorFont>
    </a:fontScheme>
  </a:themeElements>
</a:theme>`

const MASTER = `<?xml version="1.0"?>
<p:sldMaster xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld><p:bg><p:bgPr><a:solidFill><a:schemeClr val="bg1"/></a:solidFill></p:bgPr></p:bg><p:spTree/></p:cSld>
  <p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2"/>
</p:sldMaster>`

const LAYOUT = `<?xml version="1.0"?>
<p:sldLayout xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree/></p:cSld></p:sldLayout>`

const PRESENTATION = `<?xml version="1.0"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst><p:sldId id="256" r:id="rId1"/></p:sldIdLst>
  <p:sldSz cx="${SLIDE_CX}" cy="${SLIDE_CY}"/>
</p:presentation>`

const PRESENTATION_RELS = `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide1.xml"/>
</Relationships>`

/** A slide's rels: always the layout, plus whatever the test adds. */
function slideRels(extra = ''): string {
  return `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdL" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>
  ${extra}
</Relationships>`
}

function slide(body: string, background = ''): string {
  return `<?xml version="1.0"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:cSld>${background}<p:spTree>${body}</p:spTree></p:cSld>
</p:sld>`
}

/** Assembles the eight parts every one of these tests needs. */
function pkg(slideXml: string, options: { rels?: string; extra?: Record<string, string> } = {}): PptxParts {
  return new Map<string, string>([
    ['ppt/presentation.xml', PRESENTATION],
    ['ppt/_rels/presentation.xml.rels', PRESENTATION_RELS],
    ['ppt/slides/slide1.xml', slideXml],
    ['ppt/slides/_rels/slide1.xml.rels', options.rels ?? slideRels()],
    ['ppt/slideLayouts/slideLayout1.xml', LAYOUT],
    ['ppt/slideLayouts/_rels/slideLayout1.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdM" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`],
    ['ppt/slideMasters/slideMaster1.xml', MASTER],
    ['ppt/slideMasters/_rels/slideMaster1.xml.rels', `<?xml version="1.0"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdT" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`],
    ['ppt/theme/theme1.xml', THEME],
    ...Object.entries(options.extra ?? {}),
  ])
}

/** `<p:sp>` with a box at `inches` and whatever spPr/txBody the test wants. */
function shape(spPrExtra: string, txBody = '', at = { x: 1, y: 1, cx: 2, cy: 1 }): string {
  return `<p:sp>
    <p:nvSpPr><p:cNvPr id="2" name="Shape 2"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
    <p:spPr>
      <a:xfrm><a:off x="${at.x * INCH}" y="${at.y * INCH}"/><a:ext cx="${at.cx * INCH}" cy="${at.cy * INCH}"/></a:xfrm>
      ${spPrExtra}
    </p:spPr>
    ${txBody}
  </p:sp>`
}

function textBody(runs: string, pPr = '', bodyPr = '<a:bodyPr/>'): string {
  return `<p:txBody>${bodyPr}<a:lstStyle/><a:p>${pPr}${runs}</a:p></p:txBody>`
}

const layersOf = (result: ReturnType<typeof importPptx>) => result.document.layouts[0]!.layers as any[]

// ---- the scanner -------------------------------------------------------------

describe('the XML scanner', () => {
  it('reads elements, attributes and nesting', () => {
    const root = parseXml('<a:root x="1" y=\'2\'><a:kid/><a:kid z="3">words</a:kid></a:root>')
    expect(root?.name).toBe('a:root')
    expect(root?.local).toBe('root')
    expect(root?.attrs).toEqual({ x: '1', y: '2' })
    expect(children(root, 'kid')).toHaveLength(2)
    expect(num(children(root, 'kid')[1], 'z')).toBe(3)
    expect(children(root, 'kid')[1]!.text).toBe('words')
  })

  it('takes elements by prefixed name or bare local name', () => {
    const root = parseXml('<p:sld><p:cSld/></p:sld>')
    expect(child(root, 'p:cSld')).not.toBeNull()
    expect(child(root, 'cSld')).not.toBeNull()
  })

  it('skips declarations, comments and doctypes, and keeps CDATA literal', () => {
    const root = parseXml('<?xml version="1.0"?><!DOCTYPE x><r><!-- <fake/> --><t><![CDATA[a < b & c]]></t></r>')
    expect(root?.name).toBe('r')
    expect(child(root, 't')?.text).toBe('a < b & c')
    // The comment contained something that looks like an element; it is not one.
    expect(child(root, 'fake')).toBeNull()
  })

  it('resolves the entities XML defines, and leaves the rest standing', () => {
    expect(decodeEntities('a &amp; b &lt;c&gt; &#65; &#x42;')).toBe('a & b <c> A B')
    expect(decodeEntities('100% &notanentity; &')).toBe('100% &notanentity; &')
  })

  it('finds the nearest descendant rather than the deepest', () => {
    const root = parseXml('<r><outer><blip id="deep"/></outer><blip id="near"/></r>')
    expect(find(root, 'blip')?.attrs.id).toBe('near')
  })

  it('does not blow up on unbalanced or truncated markup', () => {
    expect(() => parseXml('<a><b></c></a>')).not.toThrow()
    expect(() => parseXml('<a attr="unclosed')).not.toThrow()
    expect(() => parseXml('<'.repeat(5000))).not.toThrow()
  })

  it('stays linear on input designed to make a regex parser quadratic', () => {
    // 200k characters of nested opens. A backtracking implementation does not
    // come back from this; the scanner is O(n) and returns in milliseconds.
    const started = Date.now()
    parseXml(`<r>${'<a x="1">'.repeat(20000)}</r>`)
    expect(Date.now() - started).toBeLessThan(2000)
  })
})

// ---- the page ----------------------------------------------------------------

describe('importing a deck', () => {
  it('scales a 16:9 slide onto the editor’s own page size', () => {
    const { document } = importPptx(pkg(slide('')))
    expect(document.layouts).toHaveLength(1)
    expect(document.layouts[0]!.global.width).toBe(1920)
    expect(document.layouts[0]!.global.height).toBe(1080)
  })

  it('keeps a 4:3 deck’s shape rather than stretching it to widescreen', () => {
    const parts = pkg(slide(''))
    parts.set('ppt/presentation.xml', PRESENTATION.replace(`cx="${SLIDE_CX}" cy="${SLIDE_CY}"`, 'cx="9144000" cy="6858000"'))
    const { document } = importPptx(parts)
    expect(document.layouts[0]!.global.width).toBe(1920)
    expect(document.layouts[0]!.global.height).toBe(1440)
  })

  it('places a shape where the file put it, at the page’s scale', () => {
    // 1in from each edge, 2in x 1in. 96 px to the inch, times the 1.5 page
    // scale, is 144 / 144 / 288 / 144.
    const { document } = importPptx(pkg(slide(shape('<a:solidFill><a:srgbClr val="FF0000"/></a:solidFill>'))))
    const layer = (document.layouts[0]!.layers as any[])[0]
    expect(layer).toMatchObject({ type: 'w-rect', left: 144, top: 144, width: 288, height: 144, color: '#ff0000' })
  })

  it('follows the colour map rather than assuming bg1 is white', () => {
    // The master maps bg1 to lt1, and lt1 is a sysClr whose recorded value is
    // white. Reading `val="bg1"` as a colour name would find nothing.
    const { document } = importPptx(pkg(slide('')))
    expect(document.layouts[0]!.global.backgroundColor).toBe('#ffffff')
  })

  it('reads a dark master’s background, and puts light ink on it', () => {
    const parts = pkg(slide(shape('', textBody('<a:r><a:t>Evening</a:t></a:r>'))))
    parts.set('ppt/slideMasters/slideMaster1.xml', MASTER.replace('bg1="lt1"', 'bg1="dk1"'))
    const { document } = importPptx(parts)
    expect(document.layouts[0]!.global.backgroundColor).toBe('#000000')
    // Nothing said what colour the words are, so they take the one that can be
    // read against the page rather than the one that matches it.
    expect((document.layouts[0]!.layers as any[])[0].color).toBe('#ffffff')
  })

  it('resolves a theme colour, and the tint applied to it', () => {
    const plain = importPptx(pkg(slide(shape('<a:solidFill><a:schemeClr val="accent1"/></a:solidFill>'))))
    expect(layersOf(plain)[0].color).toBe('#4472c4')

    const tinted = importPptx(pkg(slide(shape('<a:solidFill><a:schemeClr val="accent1"><a:lumMod val="60000"/><a:lumOff val="40000"/></a:schemeClr></a:solidFill>'))))
    // The pale version of the same blue: same hue, visibly lighter.
    expect(layersOf(tinted)[0].color).not.toBe('#4472c4')
    expect(parseInt(layersOf(tinted)[0].color.slice(1, 3), 16)).toBeGreaterThan(0x44)
  })

  it('carries a fill’s transparency into the colour itself', () => {
    const { document } = importPptx(pkg(slide(shape('<a:solidFill><a:srgbClr val="FF0000"><a:alpha val="50000"/></a:srgbClr></a:solidFill>'))))
    expect((document.layouts[0]!.layers as any[])[0].color).toBe('#ff000080')
  })
})

// ---- words -------------------------------------------------------------------

describe('importing text', () => {
  it('brings runs across as markup the editor already allows', () => {
    const { document } = importPptx(pkg(slide(shape('', textBody('<a:r><a:rPr b="1"/><a:t>Bold</a:t></a:r><a:r><a:t> and </a:t></a:r><a:r><a:rPr i="1" u="sng"/><a:t>rest</a:t></a:r>')))))
    const layer = (document.layouts[0]!.layers as any[])[0]
    expect(layer.type).toBe('w-text')
    expect(layer.text).toBe('<b>Bold</b> and <i><u>rest</u></i>')
  })

  it('escapes words that look like markup', () => {
    const { document } = importPptx(pkg(slide(shape('', textBody('<a:r><a:t>5 &lt; 6 &amp; rising</a:t></a:r>')))))
    const layer = (document.layouts[0]!.layers as any[])[0]
    expect(layer.text).toBe('5 &lt; 6 &amp; rising')
  })

  it('lets the run carrying the most characters set the size', () => {
    // A one-character 12pt slip at the front of a 40pt heading.
    const { document } = importPptx(pkg(slide(shape('', textBody('<a:r><a:rPr sz="1200"/><a:t>T</a:t></a:r><a:r><a:rPr sz="4000"/><a:t>he whole heading</a:t></a:r>')))))
    // 40pt at 96/72 is 53.33px.
    expect((document.layouts[0]!.layers as any[])[0].fontSize).toBe(53)
  })

  it('splits a paragraph at <a:br/> and keeps blank lines between paragraphs', () => {
    const body = `<p:txBody><a:bodyPr/><a:p><a:r><a:t>one</a:t></a:r><a:br/><a:r><a:t>two</a:t></a:r></a:p><a:p><a:r><a:t>three</a:t></a:r></a:p></p:txBody>`
    const { document } = importPptx(pkg(slide(shape('', body))))
    expect((document.layouts[0]!.layers as any[])[0].text).toBe('one<br>two<br>three')
  })

  it('takes a bullet only when the paragraph asks for one', () => {
    const bulleted = importPptx(pkg(slide(shape('', textBody('<a:r><a:t>point</a:t></a:r>', '<a:pPr><a:buChar char="•"/></a:pPr>')))))
    expect(layersOf(bulleted)[0].listStyle).toBe('bullet')
    expect(layersOf(bulleted)[0].text).toBe('<ul><li>point</li></ul>')

    const plain = importPptx(pkg(slide(shape('', textBody('<a:r><a:t>point</a:t></a:r>', '<a:pPr><a:buNone/></a:pPr>')))))
    expect(layersOf(plain)[0].listStyle).toBe('none')
  })

  it('resolves the theme’s own faces, and reports what it substituted', () => {
    // `+mn-lt` is the theme's minor font, which this theme says is Calibri.
    const { document, report } = importPptx(pkg(slide(shape('', textBody('<a:r><a:rPr><a:latin typeface="+mn-lt"/></a:rPr><a:t>Body</a:t></a:r>')))))
    expect((document.layouts[0]!.layers as any[])[0].fontClass.value).toBe('Inter')
    expect(report.fonts).toContainEqual({ from: 'Calibri', to: 'Inter' })
  })

  it('moves a centred or bottom-anchored box to where the words actually sit', () => {
    // The editor draws text from the top of its box; PowerPoint anchors it
    // inside one. A 40pt line centred in a 2in-tall placeholder is most of an
    // inch further down than its box, and importing the box position would put
    // it at the top of a gap.
    const body = textBody('<a:r><a:rPr sz="4000"/><a:t>Centred</a:t></a:r>', '', '<a:bodyPr anchor="ctr"/>')
    const { document } = importPptx(pkg(slide(shape('', body, { x: 1, y: 1, cx: 4, cy: 2 }))))
    const layer = (document.layouts[0]!.layers as any[])[0]
    // Box top 144, box height 288, one 40pt line at 1.2 spacing is 64px.
    expect(layer.top).toBe(144 + Math.round((288 - 64) / 2))
    expect(layer.height).toBe(64)

    const topAnchored = importPptx(pkg(slide(shape('', textBody('<a:r><a:rPr sz="4000"/><a:t>Top</a:t></a:r>'), { x: 1, y: 1, cx: 4, cy: 2 }))))
    expect(layersOf(topAnchored)[0].top).toBe(144)
  })

  it('leaves out the empty placeholder boxes a template is full of', () => {
    const { document } = importPptx(pkg(slide(shape('', textBody('')) + shape('', textBody('<a:r><a:t>  </a:t></a:r>')))))
    expect(document.layouts[0]!.layers).toHaveLength(0)
  })

  it('draws no rectangle behind a plain text box', () => {
    // A text box is a <p:sp> with neither fill nor outline. Importing the shape
    // as well would put an invisible layer under half the deck.
    const { document } = importPptx(pkg(slide(shape('<a:noFill/>', textBody('<a:r><a:t>Just words</a:t></a:r>')))))
    expect(document.layouts[0]!.layers).toHaveLength(1)
    expect((document.layouts[0]!.layers as any[])[0].type).toBe('w-text')
  })
})

// ---- pictures, groups, tables ------------------------------------------------

describe('importing everything else', () => {
  const picture = `<p:pic>
    <p:nvPicPr><p:cNvPr id="4" name="Crest"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
    <p:blipFill><a:blip r:embed="rIdImg"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
    <p:spPr><a:xfrm><a:off x="${INCH}" y="${INCH}"/><a:ext cx="${INCH}" cy="${INCH}"/></a:xfrm></p:spPr>
  </p:pic>`
  const withImageRel = slideRels('<Relationship Id="rIdImg" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/image1.png"/>')

  it('places a picture the caller has hosted', () => {
    const media: PptxMedia = new Map([['ppt/media/image1.png', { url: '/resources/school-image/abc', width: 400, height: 400 }]])
    const { document, report } = importPptx(pkg(slide(picture), { rels: withImageRel }), { media })
    const layer = (document.layouts[0]!.layers as any[])[0]
    expect(layer).toMatchObject({ type: 'w-image', imgUrl: '/resources/school-image/abc', left: 144, top: 144 })
    expect(report.skipped).toHaveLength(0)
  })

  it('leaves out a picture nobody hosted, and says so', () => {
    const { document, report } = importPptx(pkg(slide(picture), { rels: withImageRel }))
    expect(document.layouts[0]!.layers).toHaveLength(0)
    expect(report.skipped[0]).toMatchObject({ slide: 1, what: 'Crest' })
  })

  it('lists the media a caller has to host', () => {
    expect(pptxMediaPaths(['ppt/media/image1.png', 'ppt/slides/slide1.xml', 'ppt/media/video1.mp4'])).toEqual(['ppt/media/image1.png', 'ppt/media/video1.mp4'])
  })

  it('flattens a group into slide coordinates', () => {
    // The group sits 1in in and is drawn from a child space twice its size, so
    // a child at 2in inside it lands 1in further along at half scale.
    const grouped = `<p:grpSp>
      <p:grpSpPr><a:xfrm>
        <a:off x="${INCH}" y="${INCH}"/><a:ext cx="${2 * INCH}" cy="${2 * INCH}"/>
        <a:chOff x="0" y="0"/><a:chExt cx="${4 * INCH}" cy="${4 * INCH}"/>
      </a:xfrm></p:grpSpPr>
      ${shape('<a:solidFill><a:srgbClr val="00FF00"/></a:solidFill>', '', { x: 2, y: 2, cx: 2, cy: 2 })}
    </p:grpSp>`
    const { document } = importPptx(pkg(slide(grouped)))
    const layer = (document.layouts[0]!.layers as any[])[0]
    // (1in + 2in x 0.5) x 96px x 1.5 = 288.
    expect(layer).toMatchObject({ type: 'w-rect', left: 288, top: 288, width: 144, height: 144 })
  })

  it('reads a table into cells and column widths', () => {
    const table = `<p:graphicFrame>
      <p:nvGraphicFramePr><p:cNvPr id="6" name="Table 6"/></p:nvGraphicFramePr>
      <p:xfrm><a:off x="0" y="0"/><a:ext cx="${6 * INCH}" cy="${2 * INCH}"/></p:xfrm>
      <a:graphic><a:graphicData><a:tbl>
        <a:tblPr firstRow="1"/>
        <a:tblGrid><a:gridCol w="${2 * INCH}"/><a:gridCol w="${INCH}"/></a:tblGrid>
        <a:tr><a:tc>${textBody('<a:r><a:t>Task</a:t></a:r>')}</a:tc><a:tc>${textBody('<a:r><a:t>Due</a:t></a:r>')}</a:tc></a:tr>
        <a:tr><a:tc>${textBody('<a:r><a:t>Book the hall</a:t></a:r>')}</a:tc><a:tc>${textBody('<a:r><a:t>May 3</a:t></a:r>')}</a:tc></a:tr>
      </a:tbl></a:graphicData></a:graphic>
    </p:graphicFrame>`
    const { document } = importPptx(pkg(slide(table)))
    const layer = (document.layouts[0]!.layers as any[])[0]
    expect(layer.type).toBe('w-table')
    expect(layer.cells).toEqual([
      ['Task', 'Due'],
      ['Book the hall', 'May 3'],
    ])
    expect(layer.cols).toBe(2)
    expect(layer.headerRow).toBe(true)
    expect(layer.colWidths[0]).toBeCloseTo(2 / 3, 5)
  })

  it('refuses a chart rather than importing a grey box in its place', () => {
    const chart = `<p:graphicFrame>
      <p:nvGraphicFramePr><p:cNvPr id="7" name="Attendance chart"/></p:nvGraphicFramePr>
      <p:xfrm><a:off x="0" y="0"/><a:ext cx="${INCH}" cy="${INCH}"/></p:xfrm>
      <a:graphic><a:graphicData><c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" r:id="rId9"/></a:graphicData></a:graphic>
    </p:graphicFrame>`
    const { document, report } = importPptx(pkg(slide(chart)))
    expect(document.layouts[0]!.layers).toHaveLength(0)
    expect(report.skipped[0]!.what).toBe('Attendance chart')
    expect(report.skipped[0]!.reason).toContain('chart')
  })

  it('turns a connector into the rule it draws', () => {
    const line = `<p:cxnSp><p:nvCxnSpPr><p:cNvPr id="8" name="Line"/></p:nvCxnSpPr>
      <p:spPr>
        <a:xfrm><a:off x="0" y="${INCH}"/><a:ext cx="${4 * INCH}" cy="0"/></a:xfrm>
        <a:ln w="19050"><a:solidFill><a:srgbClr val="333333"/></a:solidFill></a:ln>
      </p:spPr></p:cxnSp>`
    const { document } = importPptx(pkg(slide(line)))
    const layer = (document.layouts[0]!.layers as any[])[0]
    expect(layer).toMatchObject({ type: 'w-rect', color: '#333333', width: 576, height: 2 })
  })

  it('reads the speaker notes onto the page', () => {
    const notes = `<?xml version="1.0"?>
      <p:notes xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><p:cSld><p:spTree>
        <p:sp><p:nvSpPr><p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>${textBody('<a:r><a:t>Mention the bus times.</a:t></a:r>')}</p:sp>
      </p:spTree></p:cSld></p:notes>`
    const parts = pkg(slide(''), {
      rels: slideRels('<Relationship Id="rIdN" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide1.xml"/>'),
      extra: { 'ppt/notesSlides/notesSlide1.xml': notes },
    })
    const { document } = importPptx(parts)
    expect(document.layouts[0]!.global.notes).toBe('Mention the bus times.')
  })

  it('takes the deck’s name from the file’s own properties', () => {
    const parts = pkg(slide(''), {
      extra: {
        'docProps/core.xml': `<?xml version="1.0"?><cp:coreProperties xmlns:cp="x" xmlns:dc="y"><dc:title>Spring Concert</dc:title></cp:coreProperties>`,
      },
    })
    expect(importPptx(parts).document.title).toBe('Spring Concert')
    expect(importPptx(parts, { title: 'Renamed' }).document.title).toBe('Renamed')
  })

  it('refuses a file that is not a presentation, and one with no slides', () => {
    expect(() => importPptx(new Map())).toThrow(/not a PowerPoint/i)
    const empty = pkg(slide(''))
    empty.set('ppt/presentation.xml', PRESENTATION.replace(/<p:sldIdLst>.*<\/p:sldIdLst>/s, '<p:sldIdLst/>'))
    expect(() => importPptx(empty)).toThrow(/no slides/i)
  })
})

// ---- fonts -------------------------------------------------------------------

describe('choosing a face', () => {
  it('maps the fonts a school deck is actually set in', () => {
    expect(nearestFont('Calibri').value).toBe('Inter')
    expect(nearestFont('Times New Roman').kind).toBe('serif')
    expect(nearestFont('Comic Sans MS').kind).toBe('handwriting')
    expect(nearestFont('Courier New').kind).toBe('mono')
    expect(nearestFont('Impact').kind).toBe('display')
  })

  it('keeps a family the editor already ships', () => {
    expect(nearestFont('Montserrat').value).toBe('Montserrat')
    expect(nearestFont('montserrat').value).toBe('Montserrat')
  })

  it('guesses by category, and always returns something', () => {
    expect(nearestFont('某个中文字体 Serif').kind).toBe('serif')
    expect(nearestFont('Unknown Mono Web').kind).toBe('mono')
    expect(nearestFont('').value).toBe('Inter')
    expect(nearestFont(undefined).value).toBe('Inter')
  })
})

// ---- against the exporter ----------------------------------------------------

describe('round trip', () => {
  it('reads back a deck this repo exported', async () => {
    // pptxgenjs is what the editor's own PowerPoint export is built on, so a
    // file it writes is the closest thing to a real .pptx available without
    // checking a binary into the repo. If the importer can read this, the two
    // halves agree about EMU, about the slide size, and about where a box goes.
    const PptxGenJS = (await import('pptxgenjs')).default
    const deck = new PptxGenJS()
    deck.defineLayout({ name: 'W', width: 13.333, height: 7.5 })
    deck.layout = 'W'
    const page = deck.addSlide()
    page.background = { color: '1F3864' }
    // `valign: 'top'` and `margin: 0` are what `exportPptx` passes, and the
    // claim being tested is that the two are inverses — so the file has to be
    // written the way the app writes one, not the way pptxgenjs defaults.
    page.addText('Spring Concert', { x: 1, y: 1, w: 6, h: 1.2, fontSize: 40, bold: true, color: 'FFFFFF', fontFace: 'Georgia', valign: 'top', margin: 0 })
    page.addShape('rect', { x: 1, y: 3, w: 4, h: 0.5, fill: { color: 'ED7D31' } })

    const buffer = (await deck.write({ outputType: 'nodebuffer' })) as Buffer
    const zip = await JSZip.loadAsync(buffer)
    const parts: PptxParts = new Map()
    for (const [name, entry] of Object.entries(zip.files)) {
      if (!entry.dir && (name.endsWith('.xml') || name.endsWith('.rels'))) parts.set(name, await entry.async('string'))
    }

    const { document, report } = importPptx(parts)
    expect(report.slides).toBe(1)
    expect(document.layouts[0]!.global.width).toBe(1920)
    expect(document.layouts[0]!.global.height).toBe(1080)
    expect(document.layouts[0]!.global.backgroundColor).toBe('#1f3864')

    const layers = document.layouts[0]!.layers as any[]
    const heading = layers.find((layer) => layer.type === 'w-text')
    expect(heading).toBeDefined()
    expect(heading.text).toContain('Spring Concert')
    expect(heading.color).toBe('#ffffff')
    expect(heading.left).toBe(144)
    expect(heading.top).toBe(144)
    // Georgia is not bundled; Merriweather is the serif it maps to.
    expect(heading.fontClass.value).toBe('Merriweather')

    const band = layers.find((layer) => layer.type === 'w-rect')
    expect(band).toBeDefined()
    expect(band.color).toBe('#ed7d31')
    expect(band.width).toBe(576)
  })
})
