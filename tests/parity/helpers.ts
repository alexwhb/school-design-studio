import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'
import type { Page } from '@playwright/test'

export const VUE_URL = process.env.VUE_URL || 'http://127.0.0.1:5174'
export const REACT_URL = process.env.REACT_URL || 'http://127.0.0.1:5273'

export const OUT_DIR = path.resolve(process.cwd(), 'test-results/parity')

export async function settle(page: Page, ms = 900) {
  await page.waitForLoadState('networkidle').catch(() => {})
  await page.waitForTimeout(ms)
  await page.evaluate(() => document.fonts.ready)
}

export async function prepare(page: Page, url: string, route: string, theme: 'dark' | 'light') {
  await page.addInitScript(
    ([value]) => {
      localStorage.setItem('ds_theme', value as string)
      localStorage.setItem('hide_replace_prompt', '1')
    },
    [theme],
  )
  await page.goto(url + route)
  await settle(page)
}

export type DiffResult = {
  mismatched: number
  total: number
  ratio: number
  diffPath: string
}

export function compare(name: string, a: Buffer, b: Buffer): DiffResult {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const imgA = PNG.sync.read(a)
  const imgB = PNG.sync.read(b)
  const width = Math.min(imgA.width, imgB.width)
  const height = Math.min(imgA.height, imgB.height)
  const diff = new PNG({ width, height })

  const cropA = crop(imgA, width, height)
  const cropB = crop(imgB, width, height)

  const mismatched = pixelmatch(cropA.data, cropB.data, diff.data, width, height, { threshold: 0.12 })
  const diffPath = path.join(OUT_DIR, `${name}.diff.png`)
  fs.writeFileSync(diffPath, PNG.sync.write(diff))
  fs.writeFileSync(path.join(OUT_DIR, `${name}.vue.png`), PNG.sync.write(cropA))
  fs.writeFileSync(path.join(OUT_DIR, `${name}.react.png`), PNG.sync.write(cropB))

  return { mismatched, total: width * height, ratio: mismatched / (width * height), diffPath }
}

function crop(img: PNG, width: number, height: number): PNG {
  if (img.width === width && img.height === height) return img
  const out = new PNG({ width, height })
  PNG.bitblt(img, out, 0, 0, width, height, 0, 0)
  return out
}
