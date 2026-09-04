/*
 * Reading a list of people out of whatever the office had to hand.
 *
 * The list that arrives is never the same shape twice: a CSV saved out of the
 * management system, a column copied from a spreadsheet (which pastes as tabs),
 * a European export separated by semicolons, or names typed one per line into
 * an email. Nobody should have to know which they have. So the separator is
 * worked out from the text, quoted cells are honoured — "Lovelace, Ada" is one
 * name, and a quoted cell may carry a line break — and whether the first row is
 * column names is guessed and then left for the person to correct.
 *
 * Pure functions over strings, so all of this can be reasoned about apart from
 * the dialog that uses it.
 */

/** How the cells in a row are separated. `'\n'` means one cell per line. */
export type TDelimiter = ',' | '\t' | ';' | '\n'

export type TTable = {
  /** One name per column: the header row if there is one, "Column 1" and so on if not. */
  columns: string[]
  /** The people, one row each, every row padded to the width of the widest. */
  rows: string[][]
  /** Whether the first row was read as column names. */
  header: boolean
  delimiter: TDelimiter
}

/** How many of `delimiter` a line holds, not counting any inside quotes. */
function countOutsideQuotes(line: string, delimiter: string): number {
  let count = 0
  let quoted = false
  for (const char of line) {
    if (char === '"') quoted = !quoted
    else if (!quoted && char === delimiter) count++
  }
  return count
}

/**
 * Which separator the text is using.
 *
 * A separator that appears the same number of times on every line is almost
 * certainly the one in use; a comma inside a name is on one line, not all of
 * them. Where two are consistent — "Lovelace, Ada;Year 6" — the semicolon or the
 * tab is the deliberate one, because commas turn up in ordinary text and those
 * two do not. With nothing consistent, the busiest one wins; with nothing at
 * all, the list is one name per line.
 */
export function detectDelimiter(text: string): TDelimiter {
  const lines = text
    .replace(/^\uFEFF/, '')
    .split(/\r\n|\r|\n/)
    .filter((line) => line.trim() !== '')
    .slice(0, 20)
  if (lines.length === 0) return '\n'

  const candidates: TDelimiter[] = ['\t', ';', ',']
  let busiest: { delimiter: TDelimiter; total: number } | null = null
  for (const delimiter of candidates) {
    const counts = lines.map((line) => countOutsideQuotes(line, delimiter))
    if (counts[0] > 0 && counts.every((count) => count === counts[0])) return delimiter
    const total = counts.reduce((sum, count) => sum + count, 0)
    if (total > 0 && (!busiest || total > busiest.total)) busiest = { delimiter, total }
  }
  return busiest ? busiest.delimiter : '\n'
}

/**
 * The text as rows of trimmed cells. Quotes follow the spreadsheet convention:
 * a cell that starts with a quote runs to the closing quote, a doubled quote
 * inside it is a literal one, and a line break inside it is part of the cell.
 * Rows with nothing in them are dropped, wherever they fall.
 */
export function parseTable(text: string, delimiter: TDelimiter = detectDelimiter(text)): string[][] {
  const source = text.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n')
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false

  const endCell = () => {
    row.push(cell.trim())
    cell = ''
  }
  const endRow = () => {
    endCell()
    if (row.some((value) => value !== '')) rows.push(row)
    row = []
  }

  for (let i = 0; i < source.length; i++) {
    const char = source[i]
    if (quoted) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          cell += '"'
          i++
        } else {
          quoted = false
        }
      } else {
        cell += char
      }
      continue
    }
    if (char === '"' && cell.trim() === '') {
      quoted = true
      cell = ''
    } else if (delimiter !== '\n' && char === delimiter) {
      endCell()
    } else if (char === '\n') {
      endRow()
    } else {
      cell += char
    }
  }
  if (cell !== '' || row.length > 0) endRow()
  return rows
}

/** A number, a percentage, or a date written with digits — none of which is a column name. */
const NUMERIC = /^[-+]?\d[\d,.]*%?$|^\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}$/

/**
 * The words a header row in a school is made of. A list whose first row is all
 * of these is a header even when the rows under it are the same shape — a
 * column of first names under "Name" looks like four names otherwise.
 */
const HEADER_WORDS = new Set(['name', 'first', 'last', 'first name', 'last name', 'surname', 'forename', 'full name', 'pupil', 'student', 'child', 'grade', 'class', 'form', 'year', 'year group', 'house', 'tutor', 'teacher', 'room', 'group', 'team', 'award', 'prize', 'subject', 'reason', 'title', 'date', 'id', 'number', 'no', 'email', 'parent', 'guardian', 'address', 'phone', 'school', 'club', 'event', 'role', 'position', 'notes'])

/**
 * A cell reduced to its shape: runs of letters become `a`, runs of digits `9`,
 * so "Ada Lovelace" and "Grace Hopper" are the same shape and "Name" is not.
 */
function shapeOf(cell: string): string {
  return cell
    .replace(/[\p{L}]+/gu, 'a')
    .replace(/\d+/g, '9')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Whether the first row names the columns rather than being a person.
 *
 * A header has no numbers in it, no blanks, and no column named twice; and it
 * is a different shape from the row beneath it — "Grade" over "Year 6", "Name"
 * over "Ada Lovelace". A single row is taken to be a person, since a header with
 * nobody under it is a list of no one.
 */
export function detectHeader(rows: string[][]): boolean {
  if (rows.length < 2) return false
  const first = rows[0]
  if (first.some((cell) => !cell || NUMERIC.test(cell))) return false
  const keys = first.map((cell) => cell.toLowerCase())
  if (new Set(keys).size !== keys.length) return false

  const second = rows[1]
  if (first.some((cell, index) => shapeOf(cell) !== shapeOf(second[index] ?? ''))) return true
  return first.every((cell) =>
    HEADER_WORDS.has(
      cell
        .toLowerCase()
        .replace(/[^\p{L} ]/gu, '')
        .trim(),
    ),
  )
}

/**
 * Column names that can each be typed as a `{{field}}`: never blank, never the
 * same as another (a second "Name" becomes "Name 2"), and free of the braces
 * that would end the field early.
 */
function columnNames(header: string[], width: number): string[] {
  const names: string[] = []
  const taken = new Set<string>()
  for (let index = 0; index < width; index++) {
    const base = (header[index] ?? '').replace(/[{}]/g, '').trim() || `Column ${index + 1}`
    let name = base
    for (let n = 2; taken.has(name.toLowerCase()); n++) name = `${base} ${n}`
    taken.add(name.toLowerCase())
    names.push(name)
  }
  return names
}

/**
 * The whole thing: separator found, rows parsed, header decided — or taken as
 * given, once the person has said which it is.
 */
export function readTable(text: string, header?: boolean): TTable {
  const delimiter = detectDelimiter(text)
  const parsed = parseTable(text, delimiter)
  const width = parsed.reduce((widest, row) => Math.max(widest, row.length), 0)
  const rows = parsed.map((row) => Array.from({ length: width }, (_, index) => row[index] ?? ''))
  const hasHeader = header ?? detectHeader(rows)
  return {
    columns: columnNames(hasHeader ? rows[0] : [], width),
    rows: hasHeader ? rows.slice(1) : rows,
    header: hasHeader,
    delimiter,
  }
}
