/** See `library.mjs`. Hand-written because the implementation is plain ESM. */

export type ContentLibraryOptions = {
  /**
   * An Unsplash access key. Without one the Photos panel shows the bundled
   * sample images and search says so rather than answering with the same
   * pictures for every term.
   */
  unsplashAccessKey?: string
  /** Your registered Unsplash application name, used in attribution links. */
  unsplashAppName?: string
  /** Points the proxy at a stub. Defaults to `https://api.unsplash.com`. */
  unsplashApiBase?: string
  /** Where the bundled templates and elements are. Defaults to this package's. */
  contentRoot?: string
}

export type ContentLibraryResponse = {
  status: number
  body: unknown
  headers?: Record<string, string>
}

export type ContentLibrary = {
  hasUnsplashKey: boolean
  /** The folder the bundled JSON is actually being read from. */
  contentRoot: string
  /** The `result` payload alone, for a caller wrapping its own envelope. */
  lookup(pathname: string, query: URLSearchParams): Promise<unknown>
  /** One whole answer: `/design/cate`, `/design/list`, `/design/temp`, `/design/material`, `/design/imgs`, `/design/imgs/download`. */
  handle(pathname: string, searchParams: URLSearchParams | string): Promise<ContentLibraryResponse>
}

export function createContentLibrary(options?: ContentLibraryOptions): ContentLibrary
export default createContentLibrary
