import { expect, test } from '@playwright/test'

const EMBED_URL = process.env.EMBED_URL || 'http://127.0.0.1:5373/embed-demo/index.html'

/** The demo's flags: ?brand, ?doc, ?ai, ?kind. See embed-demo/main.tsx. */
const embedUrl = (query = '') => (query ? `${EMBED_URL}?${query}` : EMBED_URL)

/** The editor loads fonts and a design before it settles; wait for the canvas. */
async function openEditor(page: import('@playwright/test').Page, query = '') {
  await page.goto(embedUrl(query))
  await page.waitForSelector('.ds-root #page-design-canvas')
  await page.waitForTimeout(1200)
}

/** The `ref` the demo hands out, which is how a host drives the editor. */
async function handle(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => Boolean((window as any).__studio?.current))
}

const pill = (page: import('@playwright/test').Page) => page.locator('.ds-root .top-title__saved')

/**
 * The editor has to be able to sit inside another React app without an iframe.
 * That means two things have to hold: the editor works, and nothing it ships
 * reaches out and restyles the page it is a guest on.
 */
test.describe('embedded in a host app', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(EMBED_URL)
    await page.waitForSelector('.ds-root #page-design-canvas')
    await page.waitForTimeout(1200)
  })

  test('renders the editor inside the host, with no iframe', async ({ page }) => {
    await expect(page.locator('iframe')).toHaveCount(0)
    await expect(page.locator('.ds-root #widget-panel')).toBeVisible()
    await expect(page.locator('.ds-root #style-panel')).toBeVisible()
    await expect(page.locator('.ds-root #page-design-canvas')).toBeVisible()
  })

  test('leaves the host page styling alone', async ({ page }) => {
    const host = await page.evaluate(() => {
      const h1 = document.querySelector('.host-bar h1') as HTMLElement
      const li = document.querySelector('.host-bar li') as HTMLElement
      const button = document.querySelector('button.host') as HTMLElement
      return {
        h1FontSize: getComputedStyle(h1).fontSize,
        h1Family: getComputedStyle(h1).fontFamily.split(',')[0],
        liMarker: getComputedStyle(li).listStyleType,
        bodyBackground: getComputedStyle(document.body).backgroundColor,
        buttonBackground: getComputedStyle(button).backgroundColor,
        htmlColorScheme: document.documentElement.style.colorScheme,
      }
    })
    expect(host.h1FontSize).toBe('20px')
    expect(host.h1Family).toBe('ui-sans-serif')
    expect(host.liMarker).toBe('disc')
    expect(host.bodyBackground).toBe('rgb(248, 250, 252)')
    expect(host.buttonBackground).toBe('rgb(15, 23, 42)')
    expect(host.htmlColorScheme).toBe('')
  })

  test('every rule the editor ships is confined to its own root', async ({ page }) => {
    const stray = await page.evaluate(() => {
      const out: string[] = []
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList
        try {
          rules = sheet.cssRules
        } catch {
          continue
        }
        const owner = sheet.ownerNode as HTMLElement | null
        // The host page's own <style> block is the first one in the document.
        if (owner && owner.textContent?.includes('host-shell')) continue
        for (const rule of Array.from(rules)) {
          if (!(rule instanceof CSSStyleRule)) continue
          const selector = rule.selectorText || ''
          if (!selector) continue
          // Moveable injects its own runtime CSS under generated class names.
          if (/^\.rCS/.test(selector)) continue
          if (!selector.includes('.ds-root')) out.push(selector)
        }
      }
      return out
    })
    expect(stray, `unscoped selectors: ${stray.slice(0, 10).join(' | ')}`).toEqual([])
  })

  test('the scoping leaves keyframes alone, so animations still run', async ({ page }) => {
    const keyframes = await page.evaluate(() => {
      let blocks = 0
      let broken = 0
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList
        try {
          rules = sheet.cssRules
        } catch {
          continue
        }
        for (const rule of Array.from(rules)) {
          if (!(rule instanceof CSSKeyframesRule)) continue
          blocks += 1
          // A step prefixed with a class does not parse, so the block comes
          // back empty and whatever depended on it never moves.
          if (rule.cssRules.length === 0) broken += 1
        }
      }
      return { blocks, broken }
    })
    expect(keyframes.blocks, 'the editor ships keyframes').toBeGreaterThan(10)
    expect(keyframes.broken, 'every keyframes block still has its steps').toBe(0)
  })

  test('follows the host between light and dark', async ({ page }) => {
    const surface = () => page.evaluate(() => getComputedStyle(document.querySelector('.ds-root')!).getPropertyValue('--ds-surface').trim())

    expect(await surface()).toBe('#ffffff')

    await page.getByRole('button', { name: /Host theme/ }).click()
    await page.waitForTimeout(600)
    expect(await surface()).toBe('hsl(0, 0%, 7%)')
    await expect(page.locator('.ds-root')).toHaveClass(/ds-dark/)

    await page.getByRole('button', { name: /Host theme/ }).click()
    await page.waitForTimeout(600)
    expect(await surface()).toBe('#ffffff')
  })

  test('menus and tooltips render inside the editor root, so they are styled', async ({ page }) => {
    await page.locator('.ds-root').getByText('File', { exact: true }).click()
    await page.waitForTimeout(400)
    const menu = page.locator('.ds-root .el-dropdown-menu')
    await expect(menu).toBeVisible()
    const background = await menu.evaluate((el) => getComputedStyle(el.closest('.el-popper') as HTMLElement).backgroundColor)
    expect(background).not.toBe('rgba(0, 0, 0, 0)')
  })

  test('the editor still edits: add a heading and nudge it', async ({ page }) => {
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Text' }).click()
    await page.waitForTimeout(400)
    await page.locator('.ds-root').getByText('Heading', { exact: true }).click()
    await page.waitForTimeout(600)

    const widget = page.locator('.ds-root #page-design-canvas [data-uuid]:not([data-uuid="-1"])')
    await expect(widget).toHaveCount(1)

    await widget.first().click({ position: { x: 20, y: 10 } })
    await page.waitForTimeout(400)
    const before = await widget.first().evaluate((el) => (el as HTMLElement).style.left)
    await page.keyboard.press('ArrowRight')
    await page.waitForTimeout(300)
    const after = await widget.first().evaluate((el) => (el as HTMLElement).style.left)
    expect(Number.parseFloat(after)).toBeCloseTo(Number.parseFloat(before) + 1, 1)
  })

  test('the toolbar icons are drawn from the bundled font, not boxes', async ({ page }) => {
    const family = await page
      .locator('.ds-root .iconfont')
      .first()
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toContain('iconfont')
    const loaded = await page.evaluate(() => document.fonts.check('16px iconfont'))
    expect(loaded, 'the icon font is available without the host serving it').toBe(true)
  })

  test('presenting takes over the whole window, not just the editor box', async ({ page }) => {
    await page.locator('.ds-root').getByRole('button', { name: 'Present' }).click()
    await page.waitForTimeout(1200)

    const stage = page.locator('.present')
    await expect(stage).toBeVisible()
    // Inside the editor's root, so it keeps its styles, but covering the viewport.
    const box = await stage.boundingBox()
    const viewport = page.viewportSize()!
    expect(Math.round(box!.width)).toBe(viewport.width)
    expect(Math.round(box!.height)).toBe(viewport.height)
    await expect(page.locator('.ds-root .present')).toHaveCount(1)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(500)
    await expect(page.locator('.present')).toHaveCount(0)
  })

  test('a host that keeps the brand kit hands it in and is told about changes', async ({ page }) => {
    // The planner owns the school's details; the editor is given them, uses
    // them, and reports back rather than writing to the browser's own copy.
    await page.goto(EMBED_URL + '?brand=1')
    await page.waitForSelector('.ds-root #page-design-canvas')
    await page.waitForTimeout(1200)

    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Brand' }).click()
    await page.waitForTimeout(600)
    await expect(page.locator('.ds-root #brand-name')).toHaveValue('Riverbend Academy')
    await expect(page.locator('.ds-root .brand-swatch__chip')).toHaveCount(1)

    // A template picks the host's school up as it lands.
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Templates' }).click()
    await page.waitForTimeout(600)
    await page.locator('.ds-root .panel-card:has(img[src="/covers/template-101.png"])').click()
    await page.waitForTimeout(2500)
    const lines = await page.locator('.ds-root #page-design-canvas [data-uuid] .edit-text').allInnerTexts()
    expect(lines).toContain('RIVERBEND ACADEMY')

    // And an edit in the panel comes back out to the host, which is showing
    // its own copy in the bar above the editor.
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Brand' }).click()
    await page.waitForTimeout(600)
    await page.locator('.ds-root #brand-name').fill('Riverbend Middle')
    await expect(page.locator('#host-school')).toHaveText('Riverbend Middle')

    // The browser's own store was left alone, so another editor on this origin
    // that is not host-managed still gets an empty kit.
    const stored = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open('design-studio')
          open.onsuccess = () => {
            const db = open.result
            if (!db.objectStoreNames.contains('brand')) return resolve('no store')
            const request = db.transaction('brand', 'readonly').objectStore('brand').getAll()
            request.onsuccess = () => resolve(request.result.length)
            request.onerror = () => resolve('error')
          }
          open.onerror = () => resolve('error')
        }),
    )
    expect(stored === 0 || stored === 'no store').toBe(true)
  })

  test('the resize dialog opens inside the editor and is styled', async ({ page }) => {
    await page.locator('.ds-root').getByText('File', { exact: true }).click()
    await page.waitForTimeout(400)
    await page.locator('.ds-root').getByText('Resize design\u2026', { exact: true }).click()
    await page.waitForTimeout(700)

    const dialog = page.locator('.ds-root .ds-resize-design')
    await expect(dialog).toBeVisible()
    const background = await dialog.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(background).not.toBe('rgba(0, 0, 0, 0)')
    await expect(dialog.locator('.choice')).toHaveCount(3)
  })
})

/**
 * The half of the API a planner actually uses: it hands the design in, it is
 * told when it changes, it saves it, and it drives the editor through a ref
 * rather than through the editor's DOM.
 */
test.describe('the host API', () => {
  test('a document handed in is what opens, and the restore offer never appears', async ({ page }) => {
    // Leave a draft in IndexedDB the way a previous standalone session would,
    // so that "no restore offer" means the offer was suppressed rather than
    // that there was nothing to offer.
    await openEditor(page)
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Text' }).click()
    await page.waitForTimeout(400)
    await page.locator('.ds-root').getByText('Heading', { exact: true }).click()
    await page.waitForTimeout(2600)

    await openEditor(page, 'doc=1')
    await expect(page.locator('.ds-root .el-message-box')).toHaveCount(0)
    await expect(page.locator('.ds-root .top-title input')).toHaveValue('Open House 2026')
    const lines = await page.locator('.ds-root #page-design-canvas .edit-text').allInnerTexts()
    expect(lines).toContain('Open House')
    // And the pill says the work is safe, because nothing has happened to it.
    await expect(pill(page)).toHaveText('Saved')
  })

  test('Save calls onSave, and the pill goes Saving… then Saved', async ({ page }) => {
    await openEditor(page, 'doc=1&ai=1')
    await handle(page)

    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'AI' }).click()
    await page.locator('#assistant-heading').click()
    await expect(pill(page)).toHaveText('Unsaved changes')

    const button = page.locator('.ds-root .host-save-btn')
    await expect(button).toHaveText('Save to planner')
    await button.click()
    await expect(pill(page)).toHaveText('Saving\u2026')
    await expect(pill(page)).toHaveText('Saved')
    await expect(page.locator('#host-saved')).toContainText('2 pages')
    expect(await page.evaluate(() => (window as any).__studio.current.isDirty())).toBe(false)
  })

  test('Cmd/Ctrl-S saves the same way the button does', async ({ page }) => {
    await openEditor(page, 'doc=1&ai=1')
    await handle(page)
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'AI' }).click()
    await page.locator('#assistant-heading').click()
    await expect(pill(page)).toHaveText('Unsaved changes')

    // On the editor rather than on the host bar: the shortcut is the editor's,
    // and a press with the focus outside it belongs to the host.
    await page.locator('.ds-root #page-design-canvas').click({ position: { x: 5, y: 5 } })
    await page.keyboard.press(process.platform === 'darwin' ? 'Meta+s' : 'Control+s')
    await expect(pill(page)).toHaveText('Saved')
    await expect(page.locator('#host-saved')).toContainText('pages')
  })

  test('applyOps through the ref changes what is on the canvas', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)

    const result = await page.evaluate(() => {
      const studio = (window as any).__studio.current
      const heading = studio.getDocument().layouts[0].layers.find((layer: any) => layer.brandRole === 'heading')
      return studio.applyOps([
        { op: 'setText', id: heading.uuid, text: 'Spring Open House' },
        { op: 'setText', id: 'nosuchwidget', text: 'nowhere' },
      ])
    })
    expect(result.applied).toBe(1)
    expect(result.rejected).toHaveLength(1)
    expect(result.rejected[0].reason).toContain('nosuchwidget')

    await expect(page.locator('.ds-root #page-design-canvas')).toContainText('Spring Open House')

    // One press of undo takes the whole batch back. The diff that makes an
    // entry is worked out off the main thread, so the button is disabled for a
    // moment after the change lands — waiting for it to come alive is waiting
    // for the entry to exist.
    const undo = page.locator('.ds-root .operation-item--icon').first()
    await expect(undo).not.toHaveClass(/disable/)
    await undo.click()
    await page.waitForTimeout(600)
    await expect(page.locator('.ds-root #page-design-canvas')).toContainText('Open House')
    await expect(page.locator('.ds-root #page-design-canvas')).not.toContainText('Spring Open House')
  })

  test('exportPdf resolves to a PDF the host can post somewhere', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)
    const pdf = await page.evaluate(async () => {
      const blob = await (window as any).__studio.current.exportPdf()
      return { type: blob.type, size: blob.size }
    })
    expect(pdf.type).toBe('application/pdf')
    expect(pdf.size).toBeGreaterThan(10_000)
  })

  test('exportPng draws one page, and refuses a page that is not there', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)
    const png = await page.evaluate(async () => {
      const blob = await (window as any).__studio.current.exportPng(0)
      return { type: blob.type, size: blob.size }
    })
    expect(png.type).toBe('image/png')
    expect(png.size).toBeGreaterThan(1_000)

    const refused = await page.evaluate(() =>
      (window as any).__studio.current
        .exportPng(99)
        .then(() => 'resolved')
        .catch((error: Error) => error.message),
    )
    expect(refused).toContain('no page 99')
  })

  test('the AI tab is there only when the host brought a panel', async ({ page }) => {
    await openEditor(page, 'ai=1')
    const rail = page.locator('.ds-root #widget-panel .classify-item')
    await expect(rail.first()).toContainText('AI')
    await rail.first().click()
    await expect(page.locator('.ds-root .assistant-wrap')).toBeVisible()
    await expect(page.locator('#assistant-heading')).toBeVisible()

    await openEditor(page)
    await expect(page.locator('.ds-root #widget-panel .classify-item').first()).toContainText('Templates')
    await expect(page.locator('.ds-root .assistant-wrap')).toHaveCount(0)
  })

  test('documentKind sets the page and narrows the gallery', async ({ page }) => {
    await openEditor(page, 'kind=poster')
    // Letter portrait at 150 DPI, which is what a school prints on.
    await expect(page.locator('.ds-root #style-panel input').first()).toHaveValue('1275')
    await expect(page.locator('.ds-root #style-panel input').nth(1)).toHaveValue('1650')
    // Nothing to present, and nobody to say speaker notes to.
    await expect(page.locator('.ds-root .present-btn')).toHaveCount(0)
    const chips = await page.locator('.ds-root .cates__chip').allInnerTexts()
    expect(chips).not.toContain('Slides')
    expect(chips).toContain('Posters')

    await openEditor(page, 'kind=slides')
    await expect(page.locator('.ds-root #style-panel input').first()).toHaveValue('1920')
    await expect(page.locator('.ds-root .present-btn')).toHaveCount(1)
    const slideChips = await page.locator('.ds-root .cates__chip').allInnerTexts()
    expect(slideChips).toContain('Slides')
    expect(slideChips).not.toContain('Posters')
  })

  test('uploads come from the host, not the browser', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Photos' }).click()
    await page.waitForTimeout(900)
    // The one picture the demo's in-memory store starts with.
    await expect(page.locator('.ds-root .photo-list-wrap img[src="/covers/template-101.png"]').first()).toBeVisible()

    // Nothing was written to the browser's own uploads store.
    const stored = await page.evaluate(
      () =>
        new Promise((resolve) => {
          const open = indexedDB.open('design-studio')
          open.onsuccess = () => {
            const db = open.result
            if (!db.objectStoreNames.contains('uploads')) return resolve('no store')
            const request = db.transaction('uploads', 'readonly').objectStore('uploads').getAll()
            request.onsuccess = () => resolve(request.result.length)
            request.onerror = () => resolve('error')
          }
          open.onerror = () => resolve('error')
        }),
    )
    expect(stored === 0 || stored === 'no store').toBe(true)
  })

  test('onDocumentChange reports an edit, debounced', async ({ page }) => {
    await openEditor(page, 'doc=1&ai=1')
    await handle(page)
    await expect(page.locator('#host-changes')).toHaveText('Changes seen: 0')
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'AI' }).click()
    await page.locator('#assistant-heading').click()
    await expect(page.locator('#host-changes')).toHaveText('Changes seen: 1', { timeout: 5000 })
  })
})

/**
 * What markup a design may hold has to have one answer, and it is asked in two
 * places: the editor sanitises in a browser with a DOM, and the planner
 * sanitises on a server with none. They share the allowlist and the writer.
 * These check that they also agree about what the markup said.
 */
test.describe('the markup allowlist', () => {
  test('the server’s reader and the browser’s agree, character for character', async ({ page }) => {
    await openEditor(page, 'doc=1')
    const result = await page.evaluate(async () => {
      // Vite serves both to the page; TypeScript here has no idea what a URL
      // import resolves to, which is why the specifiers are held in variables.
      const richUrl = '/src/utils/widgets/richText.ts'
      const composeUrl = '/dist-embed/compose.js'
      const rich = (await import(/* @vite-ignore */ richUrl)) as { sanitiseText: (html: string) => string }
      const compose = (await import(/* @vite-ignore */ composeUrl)) as { sanitizeMarkup: (html: string) => string }
      const cases = (window as any).__markupCases as string[]
      const disagree: { input: string; dom: string; pure: string }[] = []
      for (const input of cases) {
        const dom = rich.sanitiseText(input)
        const pure = compose.sanitizeMarkup(input)
        if (dom !== pure) disagree.push({ input, dom, pure })
      }
      return { checked: cases.length, disagree }
    })
    expect(result.checked).toBeGreaterThan(30)
    expect(result.disagree, JSON.stringify(result.disagree, null, 1)).toEqual([])
  })

  test('a setText that looks like markup lands on the page as words', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)
    const shown = await page.evaluate(async () => {
      const studio = (window as any).__studio.current
      const heading = studio.getDocument().layouts[0].layers.find((layer: any) => layer.brandRole === 'heading')
      studio.applyOps([{ op: 'setText', id: heading.uuid, text: '<img src=x onerror="window.__pwned = true">' }])
      await new Promise((resolve) => setTimeout(resolve, 600))
      return { pwned: Boolean((window as any).__pwned), imgs: document.querySelectorAll('.ds-root #page-design-canvas img[src="x"]').length }
    })
    expect(shown.pwned).toBe(false)
    expect(shown.imgs).toBe(0)
    // The characters somebody sent are on the page, as characters.
    await expect(page.locator('.ds-root #page-design-canvas')).toContainText('<img src=x onerror=')
  })

  test('a setMarkup keeps the bold and drops the script', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)
    const text = await page.evaluate(async () => {
      const studio = (window as any).__studio.current
      const heading = studio.getDocument().layouts[0].layers.find((layer: any) => layer.brandRole === 'heading')
      studio.applyOps([{ op: 'setMarkup', id: heading.uuid, html: '<b>Open</b> <script>window.__pwned2 = true</script>House' }])
      await new Promise((resolve) => setTimeout(resolve, 600))
      const widget = studio.getDocument().layouts[0].layers.find((layer: any) => layer.uuid === heading.uuid)
      return { held: widget.text, pwned: Boolean((window as any).__pwned2) }
    })
    expect(text.pwned).toBe(false)
    expect(text.held).toBe('<b>Open</b> House')
    await expect(page.locator('.ds-root #page-design-canvas b').first()).toHaveText('Open')
  })
})

/**
 * A stock photograph is on somebody else's server, and a design that points at
 * one stops looking like itself the day that server changes its mind. A host
 * that says it can take a copy gets asked to.
 */
test.describe('stock photos and the host’s store', () => {
  /** The first library tile whose picture lives somewhere else. */
  async function remoteTile(page: import('@playwright/test').Page) {
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Photos' }).click()
    const tile = page.locator('.ds-root .photo-list-wrap__library img[src^="https://"]').first()
    await tile.waitFor({ state: 'attached', timeout: 30_000 })
    return tile
  }

  test('placing one calls importUrl, and the widget ends up on the host’s copy', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)
    const tile = await remoteTile(page)
    const remote = await tile.getAttribute('src')
    expect(remote).toMatch(/^https:\/\//)

    await tile.click()
    await page.waitForFunction(() => ((window as any).__imported || []).length > 0, undefined, { timeout: 30_000 })

    // The host was asked for the photo it was showing, with what is known about it.
    const asked = await page.evaluate(() => (window as any).__imported[0])
    expect(asked.url).toMatch(/^https:\/\//)
    expect(asked.meta).toHaveProperty('width')
    expect(asked.meta).toHaveProperty('attribution')

    // And the design points at what came back, not at the library.
    await page.waitForFunction(() => (window as any).__studio.current.getDocument().layouts[0].layers.some((layer: any) => layer.type === 'w-image'), undefined, { timeout: 15_000 })
    const placed = await page.evaluate(() => {
      const image = (window as any).__studio.current
        .getDocument()
        .layouts[0].layers.filter((layer: any) => layer.type === 'w-image')
        .pop()
      return { url: image.imgUrl, width: image.width, height: image.height }
    })
    expect(placed.url).not.toMatch(/^https?:\/\//)
    expect(placed.url).toContain('/covers/')
    expect(placed.width).toBeGreaterThan(0)

    // The copy is one of the school's pictures now, so it is in My uploads.
    await expect(page.locator(`.ds-root .photo-list-wrap__uploads img[src="${placed.url}"]`).first()).toBeVisible()
  })

  test('a picture the host already has is not imported again', async ({ page }) => {
    await openEditor(page, 'doc=1')
    await handle(page)
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Photos' }).click()
    // The demo's store starts with one picture, at a path of the host's own.
    await page.locator('.ds-root .photo-list-wrap__uploads img[src="/covers/template-101.png"]').first().click()
    await page.waitForTimeout(1500)
    expect(await page.evaluate(() => ((window as any).__imported || []).length)).toBe(0)
  })

  test('a host with no importUrl places the library’s own address, as before', async ({ page }) => {
    // No ?doc, so no uploads adapter at all: the standalone behaviour.
    await openEditor(page)
    const tile = await remoteTile(page)
    await tile.click()
    await page.waitForTimeout(2500)
    // The tile shows the thumbnail and the page gets the full-size picture, so
    // the two are different addresses on the same server. What matters is that
    // it is still that server's, and that nothing was asked of the host.
    const placed = await page.locator('.ds-root #page-design-canvas .w-image img').first().getAttribute('src')
    expect(placed).toMatch(/^https:\/\/(images|plus)\.unsplash\.com\//)
    expect(await page.evaluate(() => ((window as any).__imported || []).length)).toBe(0)
  })
})

test.describe('a brand kit somebody else looks after', () => {
  test('shows the kit, and will not let this reader change it', async ({ page }) => {
    await openEditor(page, 'brand=1&readonly=1')
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Brand' }).click()
    await page.waitForTimeout(600)

    // The kit is there to look at.
    await expect(page.locator('.ds-root #brand-name')).toHaveValue('Riverbend Academy')
    await expect(page.locator('.ds-root .brand-readonly')).toHaveText('Only an administrator can change the school’s brand.')

    // Every way of changing it is gone or dead.
    await expect(page.locator('.ds-root #brand-name')).toBeDisabled()
    await expect(page.locator('.ds-root .brand-swatch__edit')).toHaveCount(0)
    await expect(page.locator('.ds-root .brand-swatch--add')).toHaveCount(0)
    await expect(page.locator('.ds-root .brand-upload')).toHaveCount(0)

    // That the one writer refuses — which is what makes this a rule rather than
    // a look — is `tests/unit/brandReadOnly.test.ts`. It cannot be checked from
    // here: the editor's module graph is inside the built bundle, and importing
    // the source file over Vite would give a second copy with its own state.

    // What the panel does *with* the kit still works: it changes the design,
    // not the school.
    await expect(page.locator('.ds-root .brand-card__apply')).toBeEnabled()
    await expect(page.locator('.ds-root .brand-token').first()).toBeEnabled()
  })

  test('without the prop the panel is editable, as it always was', async ({ page }) => {
    await openEditor(page, 'brand=1')
    await page.locator('.ds-root #widget-panel .classify-item', { hasText: 'Brand' }).click()
    await page.waitForTimeout(600)
    await expect(page.locator('.ds-root .brand-readonly')).toHaveCount(0)
    await expect(page.locator('.ds-root #brand-name')).toBeEnabled()
    await expect(page.locator('.ds-root .brand-upload')).toHaveCount(1)
  })
})
