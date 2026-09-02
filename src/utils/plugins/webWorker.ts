/*
 * @Author: ShawnPhang
 * @Date: 2022-03-06 13:53:30
 * @LastEditors: ShawnPhang <https://m.palxp.cn>
 * @LastEditTime: 2024-08-20 16:12:54
 */
export default class WebWorker {
  private worker: Worker | undefined

  constructor(useWorker: any) {
    if (typeof Worker === 'undefined') {
      console.error('Web Worker is not supported in this browser.')
    } else {
      // const file = name ? `../widgets/${name}.worker.ts` : null
      // file &&
      //   (this.worker = new Worker(new URL(file, import.meta.url), {
      //     type: 'module',
      //   }))
      this.worker = new useWorker()
    }
  }
  public start(data?: any, cb?: Function) {
    return new Promise((resolve) => {
      if (!this.worker) resolve('')
      else {
        this.worker.onmessage = (e) => {
          cb ? cb(e.data) : resolve(e.data)
        }
        this.worker.postMessage(data)
      }
    })
  }
  public send(data?: any) {
    this.worker?.postMessage(data)
  }
}
