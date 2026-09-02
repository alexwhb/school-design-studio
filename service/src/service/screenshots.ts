/*
 * @Author: ShawnPhang
 * @Date: 2020-07-22 20:13:14
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-17 11:23:58
 */
import { saveScreenshot } from '../utils/download-single'
import uuid from '../utils/uuid'
import { filePath, upperLimit, drawLink } from '../configs'
import { queueRun, queueList } from '../utils/node-queue'
// const path = require('path')

/**
 * @api {get} api/screenshots
 * @apiVersion 1.0.0
 * @apiGroup screenShot
 *
 * @apiParam {String|Number} id
 * @apiParam {String|Number} tempid
 * @apiParam {String|Number} tempType
 * @apiParam {String} width
 * @apiParam {String} height
 * @apiParam {String} screenshot_url
 * @apiParam {String} type
 * @apiParam {String} size
 * @apiParam {String} quality
 * @apiParam {String|Number} index
 */
export async function screenshots(req: any, res: any) {
  let { id, tempid, tempType, width, height, screenshot_url, type = 'file', size, quality, index = 0 } = req.query
  id == 'undefined' && (id = null)
  const url = (screenshot_url || drawLink) + `${id ? '?id=' : '?tempid='}`
  id = id || tempid
  const path = filePath + `${id}-screenshot.png`
  const thumbPath = type === 'cover' && tempType != 1 ? filePath + `${id}-cover.jpg` : null

  if (id && width && height) {
    if (queueList.length > upperLimit) {
      res.json({ code: 200, msg: '服务器表示顶不住啊，等等再来吧~' })
      return
    }
    const targetUrl = url + id + `${tempType ? '&tempType=' + tempType : ''}` + `&index=${index}`
    queueRun(saveScreenshot, targetUrl, { width, height, path, thumbPath, size, quality })
      .then(() => {
        res.setHeader('Content-Type', 'image/jpg')
        // const stats = fs.statSync(path)
        // res.setHeader('Cache-Control', stats.size)
        type === 'file' ? res.sendFile(path) : res.sendFile(thumbPath)
      })
      .catch((e: any) => {
        res.json({ code: 500, msg: '图片生成错误' })
      })
  } else {
    res.json({ code: 500, msg: '缺少参数，请检查' })
  }
}

/**
 * @api {get} api/printscreen
 * @apiVersion 1.0.0
 * @apiGroup screenShot
 *
 * @apiParam {String} url
 * @apiParam {String} width
 * @apiParam {String} height
 * @apiParam {Boolean} prevent
 * @apiParam {String} type
 * @apiParam {String} size
 * @apiParam {String} quality
 * @apiParam {Number} wait
 * @apiParam {String} ua
 * @apiParam {String} devices
 * @apiParam {Number} scale
 */
export async function printscreen(req: any, res: any) {
  
  let { width = 375, height = 0, url, type = 'file', size, quality, prevent = false, ua, devices, scale, wait } = req.query
  const path = filePath + `screenshot_${new Date().getTime()}_${uuid()}.png`
  const thumbPath = type === 'cover' ? path.replace('.png', '.jpg') : null

  if (url) {
    const sign = `${new Date().getTime()}_${uuid()}`
    req._queueSign = sign
    // console.log(url + id, path, thumbPath);
    if (queueList.length > upperLimit) {
      res.json({ code: 200, msg: '业务繁忙，等等再来吧~' })
      return
    }
    queueRun(saveScreenshot, url, { width, height, path, thumbPath, size, quality, prevent, ua, devices, scale, wait }, sign)
      .then(() => {
        if (!res.headersSent) {
          // res.setHeader('Content-Type', 'image/jpg')
          // const stats = fs.statSync(path)
          // res.setHeader('Cache-Control', stats.size)
          res.json({ code: 200, msg: '截图成功', data: { path, thumbPath } })
        } else {
          res.json({ code: 200, msg: 'ok' })
        }
      })
      .catch((e: any) => {
        res.json({ code: 500, msg: '图片生成错误!' })
      })
  } else {
    res.json({ code: 500, msg: '缺少参数，请检查' })
  }
}

export default { printscreen, screenshots }
