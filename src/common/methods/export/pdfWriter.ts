/**
 * The mechanical half of writing a PDF: objects, byte offsets, the table at
 * the end that says where each one starts.
 *
 * A PDF is a list of numbered objects followed by a cross-reference table
 * giving the byte offset of every one of them. A reader seeks straight to those
 * offsets, so a single wrong number is not a rendering glitch — it is a file
 * that opens as "damaged". Keeping the counting in one place, away from the
 * document's structure, is the difference between that being a class of bug and
 * being impossible.
 *
 * Ids are handed out before bodies are written, because the document is full of
 * forward references: the catalogue names the page tree, the page tree lists
 * pages, and a structure element points back at the page it appears on.
 */

export class PdfWriter {
  private parts: Uint8Array[] = []
  private length = 0
  private offsets = new Map<number, number>()
  private nextId = 1
  private readonly encoder = new TextEncoder()

  /** Reserves an object number. Nothing is written until `object` is called. */
  alloc(): number {
    return this.nextId++
  }

  /** A reference to an object, in the `n 0 R` form every dictionary uses. */
  static ref(id: number): string {
    return `${id} 0 R`
  }

  private put(data: string | Uint8Array) {
    const bytes = typeof data === 'string' ? this.encoder.encode(data) : data
    this.parts.push(bytes)
    this.length += bytes.length
  }

  begin() {
    this.put('%PDF-1.7\n')
    // Four bytes above 127, which is how a PDF declares itself binary. Without
    // it, anything that thinks it is moving text may rewrite the line endings
    // inside the JPEGs and quietly corrupt every page.
    this.put(new Uint8Array([0x25, 0xe2, 0xe3, 0xcf, 0xd3, 0x0a]))
  }

  /** Writes a plain object — a dictionary or an array, as a string. */
  object(id: number, body: string) {
    this.offsets.set(id, this.length)
    this.put(`${id} 0 obj\n`)
    this.put(body.endsWith('\n') ? body : `${body}\n`)
    this.put('endobj\n')
  }

  /**
   * Writes a stream object: a dictionary, then the bytes.
   *
   * `/Length` is filled in from the data rather than trusted from the caller,
   * which is the one number in a stream nobody can afford to get wrong.
   */
  stream(id: number, dict: string, data: string | Uint8Array) {
    const bytes = typeof data === 'string' ? this.encoder.encode(data) : data
    this.offsets.set(id, this.length)
    this.put(`${id} 0 obj\n`)
    this.put(`<< ${dict} /Length ${bytes.length} >>\nstream\n`)
    this.put(bytes)
    this.put('\nendstream\nendobj\n')
  }

  /** Writes the cross-reference table and trailer, and hands back the file. */
  finish(trailer: string): Blob {
    const startxref = this.length
    const count = this.nextId

    this.put(`xref\n0 ${count}\n`)
    // Every entry is exactly 20 bytes, including the two-byte ending. A reader
    // seeks by multiplying, so a short line breaks the whole table.
    this.put('0000000000 65535 f\r\n')
    for (let id = 1; id < count; id++) {
      const offset = this.offsets.get(id)
      // An id that was reserved and never written would leave a hole the table
      // has no way to describe; mark it free rather than pointing at byte zero.
      this.put(offset === undefined ? '0000000000 65535 f\r\n' : `${String(offset).padStart(10, '0')} 00000 n\r\n`)
    }
    this.put(`trailer\n<< /Size ${count} ${trailer} >>\nstartxref\n${startxref}\n%%EOF\n`)

    return new Blob(this.parts as BlobPart[], { type: 'application/pdf' })
  }
}

/** Trims float noise out of the numbers written into the file. */
export const num = (value: number): string => {
  const rounded = Math.round((Number(value) || 0) * 100) / 100
  return Object.is(rounded, -0) ? '0' : String(rounded)
}

/**
 * A PDF text string as UTF-16BE hex.
 *
 * The alternative is a literal string, which then has to escape backslashes and
 * both parentheses, and still cannot carry an accent. Design names and alt text
 * come from people, so they carry accents.
 */
export function pdfString(value: string): string {
  let hex = 'FEFF'
  for (const character of String(value)) {
    const code = character.codePointAt(0) as number
    if (code > 0xffff) {
      const offset = code - 0x10000
      hex += (0xd800 + (offset >> 10)).toString(16).padStart(4, '0')
      hex += (0xdc00 + (offset & 0x3ff)).toString(16).padStart(4, '0')
    } else {
      hex += code.toString(16).padStart(4, '0')
    }
  }
  return `<${hex.toUpperCase()}>`
}

export function pdfDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `D:${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`
}
