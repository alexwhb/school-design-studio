import { DEFAULT_FONT } from '@/assets/data/FontsData'
import { emptyCells } from './tableModel'

/**
 * What a table starts out as: three by three, a coloured heading row, the
 * body striped so the rows can be followed across, and Inter at a size that
 * reads on a slide. Every colour here is artwork rather than chrome, so it is
 * data in the design and not a token — the same table has to look the same in
 * the light theme, the dark theme and the exported file.
 */
export type TWTableSetting = {
  name: string
  type: string
  uuid: string
  left: number
  top: number
  width: number
  /** Follows the content; see wTable.tsx. Held so the selection box and exports have a size. */
  height: number
  rows: number
  cols: number
  cells: string[][]
  colWidths: number[]
  headerRow: boolean
  /** The grid lines. 0 draws none. */
  borderWidth: number
  borderColor: string
  borderStyle: string
  headerFill: string
  headerColor: string
  bodyFill: string
  /** Every second body row. Fully transparent means unstriped. */
  altFill: string
  color: string
  fontClass: { alias: string; id: number; value: string; url: string }
  fontSize: number
  fontWeight: string
  lineHeight: number
  textAlign: 'left' | 'center' | 'right'
  cellPadding: number
  opacity: number
  transform: string
  parent: string
  rotate?: string
  record: {
    width: number
    height: number
    minWidth: number
    minHeight: number
    dir: string
  }
}

export const TABLE_DEFAULT_ROWS = 3
export const TABLE_DEFAULT_COLS = 3

export const wTableSetting: TWTableSetting = {
  name: 'Table',
  type: 'w-table',
  uuid: '-1',
  left: 0,
  top: 0,
  width: 900,
  height: 190,
  rows: TABLE_DEFAULT_ROWS,
  cols: TABLE_DEFAULT_COLS,
  cells: emptyCells(TABLE_DEFAULT_ROWS, TABLE_DEFAULT_COLS),
  colWidths: [1 / 3, 1 / 3, 1 / 3],
  headerRow: true,
  borderWidth: 1,
  borderColor: '#c9ced6ff',
  borderStyle: 'solid',
  headerFill: '#2b5797ff',
  headerColor: '#ffffffff',
  bodyFill: '#ffffffff',
  altFill: '#f2f5f9ff',
  color: '#1f2937ff',
  fontClass: { alias: DEFAULT_FONT.alias, id: DEFAULT_FONT.id, value: DEFAULT_FONT.value, url: DEFAULT_FONT.url },
  fontSize: 24,
  fontWeight: 'normal',
  lineHeight: 1.4,
  textAlign: 'left',
  cellPadding: 14,
  opacity: 1,
  transform: '',
  parent: '-1',
  record: {
    width: 0,
    height: 0,
    minWidth: 120,
    minHeight: 40,
    dir: 'horizontal',
  },
}
