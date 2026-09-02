/*
 * @Author: ShawnPhang
 * @Date: 2021-09-30 14:47:22
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2023-10-16 10:56:35
 */
const isDev = process.env.NODE_ENV === 'development'
const puppeteer = require('puppeteer')
const images = require('images')
const { executablePath } = require('../configs.ts')
const forceTimeOut = 60
// const maxPXs = 8294400 
const maxPXs = 4211840
const maximum = 5000

export const saveScreenshot = async (url: string, { path, width, height, thumbPath, size = 0, quality = 0, prevent, ua, devices, scale, wait }: any) => {
  return new Promise(async (resolve: Function, reject: Function) => {
    let isPageLoad = false
    let browser: any = null
    width = Number(width).toFixed(0)
    height = Number(height).toFixed(0)

    const puppeteerArgs = {
      old: ['–no-first-run', '--no-sandbox', '--disable-setuid-sandbox', `--window-size=${width},${height}`, '–single-process', '–disable-gpu', '–no-zygote', '–disable-dev-shm-usage'],
      new: [ '–no-first-run', '--no-sandbox', '--disable-setuid-sandbox', `--window-size=${width},${height}` ]
    }
    try {
      browser = await puppeteer.launch({
        headless: true, // !isDev,
        executablePath,
        ignoreHTTPSErrors: true,
        args: puppeteerArgs.old,
        defaultViewport: null,
      })
    } catch (error) {
      console.log('Puppeteer Error: ', error, '窗口大小：', width, height);
    }
    if (!browser) {
      reject()
      return false
    }
    const regulators = setTimeout(() => {
      browser && browser.close()
      browser = null
      console.log('超时强制释放浏览器')
      resolve()
    }, forceTimeOut * 1000)

    const page = await browser.newPage()
    function limiter(w: number, h: number) {
      return w*h < maxPXs ? 1 : +(1/(w*h) * maxPXs).toFixed(2)
    }
    page.setViewport({
      width: Number(width) > maximum ? 5000 : Number(width),
      height: Number(height) > maximum ? 5000 : Number(height),
      deviceScaleFactor: !isNaN(scale) ? (+scale > 4 ? 4 : +scale) : limiter(Number(width), Number(height)),
    })
    ua && page.setUserAgent(ua)
    if (devices) {
      devices = puppeteer.devices[devices]
      devices && (await page.emulate(devices))
    }
    if (!prevent) {
      page.on('load', async () => {
        await autoScroll()
        await sleep(wait)
        // await waitTillHTMLRendered(page)
        await page.screenshot({ path, fullPage: true })
        await browser.close()
        browser = null
        compress()
        clearTimeout(regulators)
        resolve()
      })
    }
    await page.exposeFunction('loadFinishToInject', async () => {
      // await page.evaluate(() => document.body.style.background = 'transparent');
      await page.screenshot({ path, omitBackground: true })
      browserClose()
      compress()
      clearTimeout(regulators)
      resolve()
    })

    await page.goto(url, { waitUntil: 'domcontentloaded' })
    isPageLoad = true

    function compress() {
      try {
        thumbPath &&
          images(path)
            .size(+size || 300)
            .save(thumbPath, { quality: +quality || 70 })
      } catch (err) {
        console.log(err)
      }
    }

    async function autoScroll() {
      await page.evaluate(async () => {
        await new Promise((resolve: any, reject: any) => {
          try {
            const maxScroll = Number.MAX_SAFE_INTEGER
            let lastScroll = 0
            const interval = setInterval(() => {
              window.scrollBy(0, 100)
              const scrollTop = document.documentElement.scrollTop || window.scrollY
              if (scrollTop === maxScroll || scrollTop === lastScroll) {
                clearInterval(interval)
                resolve()
              } else {
                lastScroll = scrollTop
              }
            }, 100)
          } catch (err) {
            console.log(err)
            reject(err)
          }
        })
      })
    }

    function sleep(timeout: number = 1) {
      return new Promise((resolve: any) => {
        setTimeout(() => {
          resolve()
        }, timeout)
      })
    }

    // Error: Navigation failed because browser has disconnected!
    async function browserClose() {
      if (isPageLoad) {
        await browser.close()
        browser = null
      } else {
        browser = null
      }
    }
  })
}

export default { saveScreenshot }

