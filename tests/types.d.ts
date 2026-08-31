/*
 * pngjs and pixelmatch ship no types, and the two @types packages on npm are
 * for older majors than the ones here. Only the parity harness uses them, and
 * only for what is declared below.
 */
declare module 'pngjs' {
  export class PNG {
    constructor(options?: { width: number; height: number })
    width: number
    height: number
    data: Buffer
    static sync: {
      read(buffer: Buffer): PNG
      write(png: PNG): Buffer
    }
    static bitblt(src: PNG, dst: PNG, sx: number, sy: number, w: number, h: number, dx: number, dy: number): void
  }
}

declare module 'pixelmatch' {
  export default function pixelmatch(
    a: Buffer | Uint8Array,
    b: Buffer | Uint8Array,
    output: Buffer | Uint8Array | null,
    width: number,
    height: number,
    options?: { threshold?: number; includeAA?: boolean },
  ): number
}
