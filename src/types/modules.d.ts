declare module 'psd.js'

declare module '*?worker' {
  const workerConstructor: { new (): Worker }
  export default workerConstructor
}

declare module '*.png' {
  const src: string
  export default src
}

declare module 'virtual:ds-iconfont.css'
