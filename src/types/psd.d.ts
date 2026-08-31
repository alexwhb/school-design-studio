/**
 * psd.js ships no types, and the PSD import reads a handful of its API.
 *
 * Deliberately loose: the shape of a parsed PSD tree is deep, and describing it
 * properly would be a fiction anyway — the library hands back plain objects
 * whose contents depend on the file. What this buys is a compiling import.
 */
declare module 'psd.js' {
  const PSD: any
  export default PSD
}
