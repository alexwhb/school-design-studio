/*
 * @Author: ShawnPhang
 * @Date: 2022-02-03 16:30:18
 * @Description: Type: success / info / warning / error
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-04-08 18:55:12
 */
import { ElMessageBox, messageType } from 'element-plus'
export default (title: string = 'Note', message: string = '', type: messageType = 'success', extra?: any) => {
  return new Promise((resolve: Function) => {
    ElMessageBox.confirm(message, title, Object.assign({
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type,
    }, extra))
      .then(() => {
        resolve(true)
      })
      .catch(() => {
        resolve(false)
      })
  })
}
