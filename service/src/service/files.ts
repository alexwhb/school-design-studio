/*
 * @Author: ShawnPhang
 * @Date: 2024-05-16 18:25:10
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 18:52:18
 */
import { Request, Response } from 'express'
const multiparty = require('multiparty')
const { filePath } = require('../configs.ts')
const { checkCreateFolder, randomCode, copyFile, send } = require('../utils/tools.ts')

const FileUrl = 'http://localhost:7001/static/'


// api/file/upload
export async function upload(req: Request, res: Response) {
  /**
   * @api {post} /api/file/upload
   * @apiVersion 1.0.0
   * @apiGroup file
   *
   * @apiParam {File} file
   * @apiParam {String} folder
   * @apiParam {String} name
   *
   */
  const form = new multiparty.Form()
  form.parse(req, async function (err: any, fields: any, files: any) {
    if (err) {
      console.error('上传文件出错！')
      return
    }
    if (files) {
      const file = files.file ? files.file[0] : {}
      const { size, headers, originalFilename } = file
      const fileType = headers['content-type'].split('/')[1]
      const Suffix = originalFilename.split('.').pop() || fileType || 'png'
      const { folder = '', name = `${randomCode(12)}.${Suffix}` } = fields
      const folderPath = `${filePath}${folder ? `${folder}/` : ''}`
      checkCreateFolder(folderPath)
      const targetPath = `${folderPath}${name}`
      copyFile(file.path, targetPath)
        .then(() => {
          const url = `${FileUrl}${folder ? folder + '/' : ''}${name}`
          send.success(res, {
            key: `${folder}/${name}`,
            url,
          })
        })
        .catch((err: any) => {
          console.log('上传异常', err)
        })
    }
  })
}

export default { upload }
