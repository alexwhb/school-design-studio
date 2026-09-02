import type { Page } from '@playwright/test'

/** Runs the toolbar's Export and returns the PNG it writes. */
export async function exportPng(page: Page): Promise<Buffer> {
  const download = page.waitForEvent('download', { timeout: 90000 })
  await page.getByRole('button', { name: 'Export' }).click()
  const file = await download
  const stream = await file.createReadStream()
  const chunks: Buffer[] = []
  for await (const chunk of stream!) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks)
}

/** One pixel of a PNG data buffer, decoded by the browser rather than in Node. */
export async function pixelOf(page: Page, png: Buffer, x: number, y: number) {
  return page.evaluate(
    async ([data, px, py]) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + data
      await img.decode()
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0)
      const [r, g, b, a] = Array.from(ctx.getImageData(px as number, py as number, 1, 1).data)
      return { r, g, b, a }
    },
    [png.toString('base64'), x, y] as const,
  )
}
