/*
 * @Author: ShawnPhang
 * @Date: 2024-05-16 18:25:10
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-12 06:25:23
 */
import { Request, Response } from 'express'
const multiparty = require('multiparty')
const { filePath } = require('../configs.ts')
const { checkCreateFolder, filesReader, send } = require('../utils/tools.ts')

const FileUrl = 'http://localhost:7001/static/'

export default {
  // design/user/image
  async getUserImages(req: Request, res: Response) {
    /**
     * @api {post} /design/user/image
     * @apiVersion 1.0.0
     * @apiGroup user
     */
    const list = await filesReader('user')
    send.success(res, { list })
  },
}
