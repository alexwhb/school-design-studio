import { expect, test } from '@playwright/test'

const EMBED_URL = process.env.EMBED_URL || 'http://127.0.0.1:5373/embed-demo/index.html'

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
    const surface = () =>
      page.evaluate(() => getComputedStyle(document.querySelector('.ds-root')!).getPropertyValue('--ds-surface').trim())

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
    await page.locator('.ds-root').getByText('Text', { exact: true }).click()
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
    const family = await page.locator('.ds-root .iconfont').first().evaluate((el) => getComputedStyle(el).fontFamily)
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
    await page.locator('.ds-root .img-box:has(img[src="/covers/template-101.png"])').click()
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
