import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Select from '@/components/ui/Select'
import message from '@/components/ui/message'
import Uploader from '@/components/common/Uploader/Uploader'
import useNotification from '@/common/methods/notification'
import { recordHistory } from '@/common/hooks/history'
import { withPageRenderer } from '@/common/methods/export/renderPage'
import exportPdf, { DESIGN_DPI } from '@/common/methods/export/exportPdf'
import { exportQuality } from '@/common/methods/export/quality'
import { wTextSetting } from '@/components/modules/widgets/wText/wTextSetting'
import { canvasState, widgetState } from '@/store/state'
import { MAX_PAGES } from '@/store/widget/pages'
import { addWidget, updateWidgetData } from '@/store/widget/widget'
import { MAX_PDF_PEOPLE, addPersonPages, buildPersonPages, pagesAfter, pagesToAdd, type TPerson } from '@/store/widget/bulkPages'
import { fieldKey, fieldsInLayouts } from '@/utils/mergeFields'
import { renderedText } from '@/utils/widgets/textMatch'
import { readTable } from '@/utils/tabular'
import { cx } from '@/utils/dom'
import type { TdLayout } from '@/store/types'
import './bulkDocuments.less'

export type BulkDocumentsHandle = {
  open: () => void
}

type Props = {
  getTitle?: () => string
}

type TScope = 'page' | 'all'
type TOutput = 'pages' | 'pdf'

const STEPS = ['List', 'Fields', 'Output'] as const

/** Fields the brand kit fills from the school's own details; a list has no column for them. */
const isBrandField = (name: string) => fieldKey(name).startsWith('school.')

/** "Leave as it is", as a Select value alongside the column indices. */
const LEAVE = '-1'

const CANCELLED = 'bulk-documents-cancelled'

const PREVIEW_ROWS = 5

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function plural(count: number, one: string, many = `${one}s`): string {
  return `${count} ${count === 1 ? one : many}`
}

/**
 * A new text box for a field, placed the way the Text panel places a heading.
 * Big enough to be read on a certificate, and not so wide it leaves the page.
 */
function fieldTextBox(token: string) {
  const setting = JSON.parse(JSON.stringify(wTextSetting))
  setting.text = token
  setting.fontSize = 40
  setting.fontWeight = 'bold'
  const { width: pageWidth, height: pageHeight } = canvasState.dPage
  setting.width = Math.round(Math.min(setting.fontSize * 0.64 * token.length, pageWidth * 0.8))
  setting.left = Math.round((pageWidth - setting.width) / 2)
  setting.top = Math.round((pageHeight - setting.fontSize * setting.lineHeight) / 2)
  return setting
}

/**
 * One page per person.
 *
 * The office job this is for: forty certificates for a year group, a name badge
 * for everyone coming to the open evening, an award letter to each family. The
 * design is made once with `{{Name}}` where the name goes, the list is pasted
 * from wherever it already lives, and every copy is filled in — either as pages
 * of this design, where each one can still be touched up, or straight into a
 * PDF for the printer when there are too many pages to want to keep.
 *
 * Three steps in the order the decisions are made: what the list is, which
 * column fills which field, and what to make of it. Each step says out loud
 * what it has understood — how many people, which fields have no column, how
 * many pages that comes to — because the mistakes in a job like this are only
 * found at the printer otherwise.
 */
const BulkDocuments = forwardRef<BulkDocumentsHandle, Props>(function BulkDocuments({ getTitle }, ref) {
  const { dLayouts, dActiveElement } = useSnapshot(widgetState)
  const { dCurrentPage } = useSnapshot(canvasState)
  const { scale } = useSnapshot(exportQuality)

  const [visible, setVisible] = useState(false)
  const [step, setStep] = useState(0)
  const [text, setText] = useState('')
  /** The person's answer about the first row, or null while the guess stands. */
  const [headerOverride, setHeaderOverride] = useState<boolean | null>(null)
  /** Column chosen for each field, by field key; absent means the automatic match stands. */
  const [chosen, setChosen] = useState<Record<string, string>>({})
  const [scope, setScope] = useState<TScope>('page')
  const [output, setOutput] = useState<TOutput>('pages')
  const [removeTemplates, setRemoveTemplates] = useState(false)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)
  const cancelled = useRef(false)

  const table = useMemo(() => readTable(text, headerOverride ?? undefined), [text, headerOverride])
  const people = table.rows.length

  const templateIndices = useMemo(() => (scope === 'all' ? dLayouts.map((_, index) => index) : [Math.min(dCurrentPage, dLayouts.length - 1)]), [scope, dLayouts, dCurrentPage])
  const fields = useMemo(() => fieldsInLayouts(templateIndices.map((index) => dLayouts[index]) as unknown as TdLayout[]), [templateIndices, dLayouts])
  const listFields = fields.filter((name) => !isBrandField(name))
  const brandFields = fields.filter(isBrandField)

  /** Which column a field reads from: the person's choice, or the column of the same name. */
  const columnFor = (field: string): number => {
    const key = fieldKey(field)
    if (key in chosen) return Number(chosen[key])
    return table.columns.findIndex((column) => fieldKey(column) === key)
  }
  const unmatched = listFields.filter((field) => columnFor(field) < 0)

  // The output step is where the count is decided, so it opens on the choice
  // that can actually be made: a list too long for the design goes to a PDF.
  const plan = {
    templates: templateIndices,
    people: [] as TPerson[],
    removeTemplates,
  }
  const toAdd = pagesToAdd({ templates: templateIndices, people: new Array(people).fill(null) })
  const afterCount = pagesAfter({ ...plan, people: new Array(people).fill(null) })
  const overPages = afterCount > MAX_PAGES
  const overPdf = people > MAX_PDF_PEOPLE
  useEffect(() => {
    if (step === 2 && overPages && output === 'pages') setOutput('pdf')
    // Only when arriving on the step: a choice made there stands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  const open = () => {
    setStep(0)
    setChosen({})
    setScope('page')
    setOutput('pages')
    setRemoveTemplates(false)
    setProgress(null)
    setVisible(true)
  }
  useImperativeHandle(ref, () => ({ open }), [])

  const close = (next: boolean) => {
    // A run in progress is stopped with its own button, not by dismissing the box.
    if (!next && progress) return
    setVisible(next)
  }

  async function readFile(file: File) {
    try {
      setText(await file.text())
      setHeaderOverride(null)
    } catch {
      message({ message: 'That file could not be read.', type: 'error' })
    }
  }

  /** The people as the page builder wants them: a name, and a way to fill each field. */
  function buildPeople(): TPerson[] {
    const columns = new Map<string, number>()
    for (const field of listFields) {
      const column = columnFor(field)
      if (column >= 0) columns.set(fieldKey(field), column)
    }
    return table.rows.map((row, index) => ({
      name: row[0]?.trim() || `Person ${index + 1}`,
      resolve: (name: string) => {
        if (isBrandField(name)) return undefined
        const column = columns.get(fieldKey(name))
        return column === undefined ? undefined : (row[column] ?? '')
      },
    }))
  }

  /**
   * Puts `{{Column}}` where the person is working: on the end of the selected
   * text box, or in a new one when nothing is selected. Each is one undo step.
   */
  function insertField(column: string) {
    const token = `{{${column}}}`
    const active = widgetState.dActiveElement
    if (active && active.uuid !== '-1' && active.type === 'w-text' && typeof active.text === 'string') {
      const current = active.text
      const plain = renderedText(current)
      const gap = plain && !/\s$/.test(plain) ? ' ' : ''
      recordHistory(() => updateWidgetData({ uuid: active.uuid, key: 'text', value: current + gap + escapeHtml(token) }))
      message({ message: `Added ${token} to the selected text box.`, type: 'success' })
      return
    }
    recordHistory(() => addWidget(fieldTextBox(escapeHtml(token))))
    message({ message: `Added a text box with ${token}. Move it where the ${column.toLowerCase()} should go.`, type: 'success' })
  }

  function addPages() {
    const list = buildPeople()
    let outcome = { added: 0, first: 0 }
    // One undo step for the whole batch, so Ctrl+Z once takes every page back out.
    recordHistory(() => {
      outcome = addPersonPages({ templates: templateIndices, people: list, removeTemplates })
    })
    setVisible(false)
    if (outcome.added === 0) {
      message({ message: 'No pages were added.', type: 'warning' })
      return
    }
    const removed = removeTemplates ? ` The template ${plural(templateIndices.length, 'page').replace(/^\d+ /, '')} ${templateIndices.length === 1 ? 'was' : 'were'} removed.` : ''
    useNotification('Pages added', `${plural(outcome.added, 'page')} added, one for each of ${plural(people, 'person', 'people')}.${removed}`, { type: 'success' })
  }

  async function downloadPdf() {
    const list = buildPeople()
    const layouts = buildPersonPages(
      templateIndices.map((index) => widgetState.dLayouts[index]),
      list,
    )
    const title = `${getTitle?.() || 'Untitled design'} – ${plural(list.length, 'copy', 'copies')}`
    cancelled.current = false
    setProgress({ done: 0, total: layouts.length })
    try {
      await withPageRenderer((renderer) =>
        exportPdf(layouts, {
          title,
          scale,
          renderPage: (index, renderScale) => {
            if (cancelled.current) throw new Error(CANCELLED)
            setProgress({ done: index + 1, total: layouts.length })
            return renderer.renderLayout(layouts[index], renderScale)
          },
        }),
      )
      setVisible(false)
      useNotification('PDF downloaded', `${plural(layouts.length, 'page')}, one for each of ${plural(people, 'person', 'people')}.`, {
        type: 'success',
      })
    } catch (e: any) {
      if (e?.message === CANCELLED) {
        message({ message: 'Stopped. No PDF was made.', type: 'info' })
      } else {
        console.error('[bulk documents] pdf failed', e)
        message({ message: e?.message || 'Sorry, that did not work. Please try again.', type: 'error' })
      }
    } finally {
      setProgress(null)
    }
  }

  const targetBox = dActiveElement && dActiveElement.uuid !== '-1' && dActiveElement.type === 'w-text' && typeof dActiveElement.text === 'string' ? renderedText(dActiveElement.text).trim().slice(0, 40) || 'the selected text box' : null

  const qualityName = scale === 1 ? 'Standard' : scale === 2 ? 'Print' : 'Large'

  const footer = (() => {
    if (progress) {
      return (
        <>
          <span className="progress" role="status">
            Drawing {progress.done} of {progress.total}
          </span>
          <Button onClick={() => (cancelled.current = true)}>Cancel</Button>
        </>
      )
    }
    return (
      <>
        {step > 0 ? <Button onClick={() => setStep(step - 1)}>Back</Button> : <Button onClick={() => setVisible(false)}>Cancel</Button>}
        {step < 2 ? (
          <Button type="primary" disabled={people === 0} onClick={() => setStep(step + 1)}>
            Next
          </Button>
        ) : output === 'pages' ? (
          <Button type="primary" disabled={people === 0 || overPages} onClick={addPages}>
            Add pages
          </Button>
        ) : (
          <Button type="primary" disabled={people === 0 || overPdf} onClick={downloadPdf}>
            Download PDF
          </Button>
        )}
      </>
    )
  })()

  return (
    <Dialog open={visible} onOpenChange={close} title="Make one for each person" width={620} className="is-align-center ds-bulk-documents" closeOnClickModal={false} footer={footer}>
      <ol className="steps" aria-label="Steps">
        {STEPS.map((name, index) => (
          <li key={name} className={cx('steps__item', { 'is-on': index === step, 'is-done': index < step })}>
            <span className="steps__num">{index + 1}</span> {name}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section className="step step--list">
          <p className="lead">Paste the list of people, or choose a file. One person per line; columns can be separated by commas, tabs or semicolons.</p>
          <textarea
            id="bulk-list"
            className="el-textarea__inner paste"
            rows={6}
            placeholder={'Name,Grade\nAda Lovelace,Year 6\nGrace Hopper,Year 5'}
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              setHeaderOverride(null)
            }}
          />
          <div className="list-tools">
            <Uploader hold accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain" onLoad={readFile}>
              <Button plain>Choose a file</Button>
            </Uploader>
            <Checkbox className="header-toggle" value={table.header} label="First row is column names" onChange={(value) => setHeaderOverride(value)} />
            <span className="people-count" role="status">
              {people === 0 ? 'No people yet' : plural(people, 'person', 'people')}
            </span>
          </div>
          {table.rows.length > 0 ? (
            <div className="preview">
              <table>
                <thead>
                  <tr>
                    {table.columns.map((column) => (
                      <th key={column}>{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {table.rows.slice(0, PREVIEW_ROWS).map((row, r) => (
                    <tr key={r}>
                      {row.map((cell, c) => (
                        <td key={c}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {table.rows.length > PREVIEW_ROWS ? <p className="preview__more">and {table.rows.length - PREVIEW_ROWS} more</p> : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {step === 1 ? (
        <section className="step step--fields">
          <div className="fields">
            <h4 className="block__title">Fields in the design</h4>
            {listFields.length === 0 ? (
              <p className="empty">
                This design has no fields yet. Click a column on the right to add one, such as <code>{'{{Name}}'}</code> where the name should go.
              </p>
            ) : (
              listFields.map((field) => {
                const column = columnFor(field)
                return (
                  <div key={fieldKey(field)} className={cx('field-row', { 'is-unmatched': column < 0 })}>
                    <code className="field-row__name">{`{{${field}}}`}</code>
                    <Select className="field-row__pick" value={column < 0 ? LEAVE : String(column)} options={[...table.columns.map((name, index) => ({ label: name, value: String(index) })), { label: 'Leave as it is', value: LEAVE }]} onChange={(value) => setChosen((prev) => ({ ...prev, [fieldKey(field)]: String(value) }))} />
                    {column < 0 ? <span className="field-row__flag">No column — left as typed</span> : null}
                  </div>
                )
              })
            )}
            {brandFields.length > 0 ? <p className="reserved">Filled by the brand kit: {brandFields.map((field) => `{{${field}}}`).join(', ')}</p> : null}
          </div>
          <div className="columns">
            <h4 className="block__title">Columns in the list</h4>
            <div className="chips">
              {table.columns.map((column) => (
                <button key={column} type="button" className="chip" onClick={() => insertField(column)}>
                  {`{{${column}}}`}
                </button>
              ))}
            </div>
            <p className="hint">{targetBox ? `Click a column to add it to the end of “${targetBox}”.` : 'Click a column to add a new text box carrying it. Select a text box before opening this window to add to that box instead.'}</p>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section className="step step--output">
          {dLayouts.length > 1 ? (
            <div className="block">
              <h4 className="block__title">Copy</h4>
              <div className="scopes">
                <button type="button" className={cx('scope', { 'is-on': scope === 'page' })} onClick={() => setScope('page')}>
                  This page
                </button>
                <button type="button" className={cx('scope', { 'is-on': scope === 'all' })} onClick={() => setScope('all')}>
                  All {dLayouts.length} pages
                </button>
              </div>
            </div>
          ) : null}

          <div className="block">
            <h4 className="block__title">Make</h4>
            <button type="button" className={cx('choice', { 'is-on': output === 'pages' })} onClick={() => setOutput('pages')}>
              <span className="choice__name">Add pages to this design</span>
              <span className="choice__hint">Each person's pages are added after the template, named after them, and can still be edited.</span>
            </button>
            <button type="button" className={cx('choice', { 'is-on': output === 'pdf' })} onClick={() => setOutput('pdf')}>
              <span className="choice__name">Download a PDF</span>
              <span className="choice__hint">One file for the printer, one page per person. Nothing is added to the design.</span>
            </button>
          </div>

          <p className="summary" role="status">
            {plural(people, 'person', 'people')} × {plural(templateIndices.length, 'page')} = {plural(toAdd, 'page')}.{unmatched.length > 0 ? ` ${plural(unmatched.length, 'field')} left as typed: ${unmatched.map((f) => `{{${f}}}`).join(', ')}.` : ''}
          </p>

          {output === 'pages' && overPages ? (
            <p className="cap-note" role="alert">
              That would make {afterCount} pages, and a design can hold {MAX_PAGES}. Download a PDF instead — it has no page limit, only a limit of {MAX_PDF_PEOPLE} people at a time.
            </p>
          ) : null}
          {output === 'pdf' && overPdf ? (
            <p className="cap-note" role="alert">
              A PDF can be made for up to {MAX_PDF_PEOPLE} people at a time, and this list has {people}. Split the list and run it again for the rest.
            </p>
          ) : null}

          {output === 'pages' ? (
            <Checkbox className="remove-toggle" value={removeTemplates} label={templateIndices.length === 1 ? 'Remove the template page afterwards' : 'Remove the template pages afterwards'} onChange={setRemoveTemplates} />
          ) : (
            <p className="quality-note">
              {qualityName} quality, {scale * DESIGN_DPI} DPI — change it under Export before starting.
            </p>
          )}
        </section>
      ) : null}
    </Dialog>
  )
})

export default BulkDocuments
