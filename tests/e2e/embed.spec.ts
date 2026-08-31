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
})
