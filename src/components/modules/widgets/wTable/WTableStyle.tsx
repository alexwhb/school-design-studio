/**
 * The settings panel a table gets.
 *
 * Rows and columns first, because that is what people reach for; then the
 * type, then the colours, then the grid lines. Every colour here is artwork —
 * it is in the design, not the editor — so none of it comes from the theme.
 */
import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { FONT_GROUPS } from '@/assets/data/FontsData'
import { useFontStore } from '@/common/methods/fonts'
import { recordHistory } from '@/common/hooks/history'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import { PanelSection } from '@/components/ui/PanelSection'
import Segmented from '@/components/ui/Segmented'
import { widgetState } from '@/store/state'
import { updateWidgetData } from '@/store/widget'
import { updateTable } from '@/store/widget/table'
import ArrangeRow from '../../settings/ArrangeRow'
import BorderControls from '../../settings/BorderControls'
import ColorSelect from '../../settings/ColorSelect'
import NumberSlider from '../../settings/NumberSlider'
import TransformGrid from '../../settings/TransformGrid'
import ValueSelect from '../../settings/ValueSelect'
import { MAX_COLS, MAX_ROWS, insertCol, insertRow, readTable, removeCol, removeRow } from './tableModel'
import './wTableStyle.less'

const FONT_SIZE_LIST = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 60, 72]

const ALIGNMENTS = [
  { label: 'Left', value: 'left' },
  { label: 'Centre', value: 'center' },
  { label: 'Right', value: 'right' },
]

function buildFontLists() {
  const fontLists: Record<string, any> = {}
  for (const group of Object.values(FONT_GROUPS)) fontLists[group] = []
  for (const font of useFontStore.list) {
    const { id, oid, value, url, alias, preview, kind } = font
    fontLists[FONT_GROUPS[kind]].push({ id, oid, value, url, alias, preview })
  }
  return fontLists
}

export default function WTableStyle() {
  const active = useSnapshot(widgetState).dActiveElement as any
  const [fontClassList, setFontClassList] = useState<Record<string, any>>({})

  useEffect(() => {
    const timer = setTimeout(() => setFontClassList(buildFontLists()), 100)
    return () => clearTimeout(timer)
  }, [])

  if (!active) return null
  const uuid = active.uuid as string
  const table = readTable(active)

  function finish(key: string, value: any) {
    updateWidgetData({ uuid, key: key as any, value })
  }

  /** The grid as the store holds it now, not as this render saw it. */
  function live() {
    return readTable(widgetState.dActiveElement)
  }

  function addRow() {
    const { cells, rows } = live()
    recordHistory(() => updateTable(uuid, { cells: insertRow(cells, rows) }))
  }
  function dropRow() {
    const { cells, rows } = live()
    recordHistory(() => updateTable(uuid, { cells: removeRow(cells, rows - 1) }))
  }
  function addCol() {
    const { cells, colWidths, cols } = live()
    recordHistory(() => updateTable(uuid, insertCol(cells, colWidths, cols)))
  }
  function dropCol() {
    const { cells, colWidths, cols } = live()
    recordHistory(() => updateTable(uuid, removeCol(cells, colWidths, cols - 1)))
  }

  return (
    <div className="ds-table-style">
      <PanelSection title="Transform">
        <TransformGrid active={active} minSize={120} onChange={finish} />
        <ArrangeRow uuid={uuid} className="arrange-row" label="" />
      </PanelSection>

      <PanelSection title="Rows and columns">
        <div className="table-shape">
          <span className="table-shape__count">
            {table.rows} {table.rows === 1 ? 'row' : 'rows'} × {table.cols} {table.cols === 1 ? 'column' : 'columns'}
          </span>
          <div className="table-shape__buttons">
            <Button plain size="small" disabled={table.rows >= MAX_ROWS} onClick={addRow}>
              Add row
            </Button>
            <Button plain size="small" disabled={table.rows <= 1} onClick={dropRow}>
              Remove row
            </Button>
            <Button plain size="small" disabled={table.cols >= MAX_COLS} onClick={addCol}>
              Add column
            </Button>
            <Button plain size="small" disabled={table.cols <= 1} onClick={dropCol}>
              Remove column
            </Button>
          </div>
          <Checkbox value={table.headerRow} label="First row is a heading" onChange={(value) => updateTable(uuid, { headerRow: value })} />
        </div>
      </PanelSection>

      <PanelSection title="Text">
        <div className="line-layout style-item">
          <ValueSelect value={active.fontClass} label="Font" data={fontClassList} inputWidth="152px" readonly onFinish={(font) => finish('fontClass', font as any)} />
          <ValueSelect value={active.fontSize} label="Size" suffix="px" data={FONT_SIZE_LIST} onFinish={(value) => finish('fontSize', Number(value))} />
        </div>
        <div className="style-item">
          <span className="table-label">Alignment</span>
          <Segmented aria-label="Alignment" size="sm" value={active.textAlign || 'left'} options={ALIGNMENTS} onChange={(value) => finish('textAlign', value)} />
        </div>
        <ColorSelect className="style-item" label="Text colour" value={active.color} onValueChange={(value) => finish('color', value)} />
        <div className="slide-wrap">
          <NumberSlider value={Number(active.cellPadding) || 0} label="Cell padding" maxValue={60} onChange={(value) => finish('cellPadding', value)} />
        </div>
      </PanelSection>

      <PanelSection title="Colours">
        <ColorSelect className="style-item" label="Heading fill" value={active.headerFill} onValueChange={(value) => finish('headerFill', value)} />
        <ColorSelect className="style-item" label="Heading text" value={active.headerColor} onValueChange={(value) => finish('headerColor', value)} />
        <ColorSelect className="style-item" label="Body fill" value={active.bodyFill} onValueChange={(value) => finish('bodyFill', value)} />
        <ColorSelect label="Every second row" value={active.altFill} onValueChange={(value) => finish('altFill', value)} />
      </PanelSection>

      <PanelSection title="Grid lines">
        <BorderControls label="Lines" width={active.borderWidth} color={active.borderColor} style={active.borderStyle} maxWidth={12} onChange={finish} />
      </PanelSection>
    </div>
  )
}
