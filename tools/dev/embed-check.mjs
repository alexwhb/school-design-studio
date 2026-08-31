import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('pageerror', (e) => console.log('PAGEERROR', e.message))
await page.goto('http://127.0.0.1:5373/embed-demo/index.html')
await page.waitForTimeout(3000)

const probe = () =>
  ({
    htmlClass: document.documentElement.className,
    htmlColorScheme: document.documentElement.style.colorScheme,
    rootClass: document.querySelector('.ds-root')?.className,
    editorSurface: getComputedStyle(document.querySelector('.ds-root')).getPropertyValue('--ds-surface').trim(),
    hostH1: getComputedStyle(document.querySelector('.host-bar h1')).fontSize,
    hostLi: getComputedStyle(document.querySelector('.host-bar li')).listStyleType,
    hostBodyBg: getComputedStyle(document.body).backgroundColor,
    hostBoxSizing: getComputedStyle(document.querySelector('.host-bar h1')).boxSizing,
    widgetPanel: !!document.querySelector('.ds-root #widget-panel'),
    canvas: !!document.querySelector('.ds-root #page-design-canvas'),
  })

console.log('initial ', JSON.stringify(await page.evaluate(probe)))
await page.getByRole('button', { name: /Host theme/ }).click()
await page.waitForTimeout(700)
console.log('darkHost', JSON.stringify(await page.evaluate(probe)))
await page.getByRole('button', { name: /Host theme/ }).click()
await page.waitForTimeout(700)
console.log('lightHost', JSON.stringify(await page.evaluate(probe)))
await browser.close()
