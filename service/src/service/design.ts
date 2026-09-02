/*
 * @Author: ShawnPhang
 * @Date: 2024-05-16 18:25:10
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-17 11:22:42
 */
import { Request, Response } from 'express'
import fs from 'fs'
import path from 'path'
import axios from '../utils/http'
import multiparty from 'multiparty'
import { filePath } from '../configs'
import { checkCreateFolder, randomCode, send } from '../utils/tools'

const FileUrl = 'http://localhost:7001/static/'


// design/list
export async function getTemplates(req: any, res: Response) {
  /**
   * @api {get} /design/list
   * @apiVersion 1.0.0
   * @apiGroup design
   */
  const { cate, type } = req.query
  const tempPath = type == 1 ? `../mock/components/list/${cate}.json` : '../mock/templates/list.json'
  try {
    const list = fs.readFileSync(path.resolve(__dirname, tempPath), 'utf8')
    send.success(res, { list: JSON.parse(list) })
  } catch (error) {}
}

// design/temp
export async function getDetail(req: any, res: Response) {
  /**
   * @api {get} /design/list
   * @apiVersion 1.0.0
   * @apiGroup design
   */
  const { cate, type, id } = req.query
  const dPath = type == 1 ? `../mock/components/detail/${id}.json` : `../mock/templates/${id}.json`
  try {
    const detail = fs.readFileSync(path.resolve(__dirname, dPath), 'utf8')
    send.success(res, JSON.parse(detail))
  } catch (error) {}
}

// design/material
export async function getMaterial(req: any, res: any) {
  /**
   * @api {get} /design/material
   * @apiVersion 1.0.0
   * @apiGroup design
   */
  const { cate } = req.query
  try {
    const detail = fs.readFileSync(path.resolve(__dirname, `../mock/materials/${cate}.json`), 'utf8')
    send.success(res, { list: JSON.parse(detail) })
  } catch (error) {
    console.log(error)
  }
}

// design/imgs
export async function getPhotos(req: any, res: any) {
  /**
   * @api {get} /design/imgs
   * @apiVersion 1.0.0
   * @apiGroup design
   */
  const { cate } = req.query
  try {
    const detail = fs.readFileSync(path.resolve(__dirname, `../mock/materials/photos/${cate}.json`), 'utf8')
    send.success(res, { list: JSON.parse(detail) })
  } catch (error) {}
}

// design/edit
export async function saveTemplate(req: any, res: any) {
  /**
   * @api {post} /design/edit
   * @apiVersion 1.0.0
   * @apiGroup design
   */
  let { id, title, data, width, height, type, cate, tag } = req.body
  const folder = type == 1 ? 'components/detail' : 'templates'
  const listPath = type == 1 ? 'components/list/comp.json' : 'templates/list.json'
  try {
    const isAdd = !id
    id = id || randomCode(8)
    const savePath = path.resolve(__dirname, `../mock/${folder}/${id}.json`)
    const jsonData = {
      id,
      data,
      title,
      width,
      height,
    }
    fs.writeFileSync(savePath, JSON.stringify(jsonData))
    const size = width > height ? 640 : 320
    const fetchScreenshotUrl = `http://localhost:7001/api/screenshots?tempid=${id}&tempType=${type}&width=${width}&height=${height}&type=cover&size=${size}&quality=75`
    await axios.get(fetchScreenshotUrl, { responseType: 'arraybuffer' })
    if (isAdd) {
      const listVal = fs.readFileSync(path.resolve(__dirname, `../mock/${listPath}`), 'utf8')
      const list = JSON.parse(listVal)
      const cover = type == 1 ? FileUrl + `/${id}-screenshot.png` : FileUrl + `/${id}-cover.jpg`
      list.unshift({ id, cover, title, width, height })
      fs.writeFileSync(path.resolve(__dirname, `../mock/${listPath}`), JSON.stringify(list))
    }
    send.success(res, { id })
  } catch (error) {
    console.log(error)
  }
}

export default {
  getTemplates,
  getDetail,
  getMaterial,
  getPhotos,
  saveTemplate
}
