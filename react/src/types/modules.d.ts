declare module 'psd.js'

declare module '*?worker' {
  const workerConstructor: { new (): Worker }
  export default workerConstructor
}
