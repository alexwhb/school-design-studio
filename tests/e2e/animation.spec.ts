import { expect, test } from '@playwright/test'
import { WIDGET, addText, openEditor, selectFirstWidget } from './helpers'

test.beforeEach(async ({ page }) => {
  await openEditor(page)
})

/** Gives the selected element an entrance, and optionally says when it starts. */
async function giveAnimation(page: import('@playwright/test').Page, preset: string, starts?: string) {
  await page.locator('.animate').getByText('Choose', { exact: true }).click()
  await page.waitForTimeout(1200)
  await page.locator('.picker__grid .tile', { hasText: preset }).first().click()
  await page.waitForTimeout(1600)
  if (starts) {
    await page.locator('.animate .value-select .input-wrap').click()
    await page.waitForTimeout(600)
    await page.getByText(starts, { exact: true }).click()
    await page.waitForTimeout(600)
  }
}

test('an entrance is played on arrival, not baked into the slide', async ({ page }) => {
  await addText(page, 'Heading')
  await selectFirstWidget(page)
  await giveAnimation(page, 'Rise')

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(300)

  // The Web Animations API is driving it, so the element has running animations
  // and is part way through them — nothing about it at rest has changed. Rise
  // is a transform and an opacity, which is two tracks (see animations/play.ts).
  const playing = await page.evaluate(() => {
    const el = document.querySelector('.present .slide [data-anim]') as HTMLElement
    return { animations: el.getAnimations().length, opacity: Number(getComputedStyle(el).opacity) }
  })
  expect(playing.animations, 'the entrance is running on the element').toBe(2)
  expect(playing.opacity, 'and it is part way through').toBeLessThan(1)

  await page.waitForTimeout(1200)
  const settled = await page.evaluate(() => {
    const el = document.querySelector('.present .slide [data-anim]') as HTMLElement
    const style = getComputedStyle(el)
    return { opacity: style.opacity, pending: el.classList.contains('ds-anim-pending') }
  })
  expect(settled).toEqual({ opacity: '1', pending: false })
  await page.keyboard.press('Escape')
})

test('an element set to start on click waits for the presenter to advance', async ({ page }) => {
  await addText(page, 'Heading')
  await addText(page, 'Body text')
  await expect(page.locator(WIDGET)).toHaveCount(2)

  // The first animated element always opens the slide, whatever it is set to —
  // there is nothing before it to wait for — so both need an entrance for the
  // second one's "on click" to mean anything.
  await selectFirstWidget(page)
  await giveAnimation(page, 'Rise')

  await page.locator(WIDGET).nth(1).click({ position: { x: 20, y: 10 } })
  await page.waitForTimeout(500)
  await giveAnimation(page, 'Pop', 'On click')
  await expect(page.locator('.animate__note')).toHaveText('Holds until you advance the slide')

  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1500)

  const held = () =>
    page.evaluate(() => {
      const els = Array.from(document.querySelectorAll('.present .slide [data-anim]')) as HTMLElement[]
      return els.map((el) => el.classList.contains('ds-anim-pending'))
    })

  // One page, so the counter does not move — but there is still a build to run.
  await expect(page.locator('.present__counter')).toContainText('1 / 1')
  expect(await held(), 'the second element is held back').toContain(true)

  await page.keyboard.press('ArrowRight')
  await page.waitForTimeout(1200)
  expect(await held(), 'and comes on when you advance').toEqual([false, false])
  await page.keyboard.press('Escape')
})

test('an element with no entrance is simply there', async ({ page }) => {
  await addText(page, 'Heading')
  await page.getByRole('button', { name: 'Present' }).click()
  await page.waitForTimeout(1200)

  // Every layer carries the marker so the presenter can find it; what says an
  // element has an entrance is whether anything is scheduled for it.
  const state = await page.evaluate(() => {
    const el = document.querySelector('.present .slide [data-anim]') as HTMLElement
    return { animations: el.getAnimations().length, pending: el.classList.contains('ds-anim-pending'), opacity: getComputedStyle(el).opacity }
  })
  expect(state).toEqual({ animations: 0, pending: false, opacity: '1' })
  await expect(page.locator('.present .slide .edit-text').first()).toBeVisible()
  await page.keyboard.press('Escape')
})
