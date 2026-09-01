import { useState } from 'react'
import { useSnapshot } from 'valtio'
import Button from '@/components/ui/Button'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import message from '@/components/ui/message'
import exportPptx, { type PptxMode } from '@/common/methods/export/exportPptx'
import exportPdf, { DESIGN_DPI, type ExportScale } from '@/common/methods/export/exportPdf'
import { withPageRenderer } from '@/common/methods/export/renderPage'
import { canvasState, widgetState } from '@/store/state'
import { cx } from '@/utils/dom'
import './exportMenu.less'

type Props = {
  getTitle?: () => string
  onSelect: (name: string, scale: ExportScale) => void
  onProgress: (data: { downloadPercent: number; downloadText: string; downloadMsg?: string }) => void
}

/**
 * Named for the job, not the multiplier.
 *
 * 150 DPI is what the page presets are drawn at, so it is what you get without
 * asking; 300 is the number a print shop will ask you for; 450 is for something
 * read from a metre away and worth the file size.
 */
const SCALES: { scale: ExportScale; name: string }[] = [
  { scale: 1, name: 'Standard' },
  { scale: 2, name: 'Print' },
  { scale: 3, name: 'Large' },
]

export default function ExportMenu({ getTitle, onSelect, onProgress }: Props) {
  const { dLayouts } = useSnapshot(widgetState)
  const { dPage } = useSnapshot(canvasState)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState(false)
  const [scale, setScale] = useState<ExportScale>(1)

  /** What the export will actually produce, in both the units people think in. */
  const inches = (px: number) => Math.round((px / DESIGN_DPI) * 10) / 10
  const sizeHint = `${Math.round((dPage?.width || 0) * scale)} × ${Math.round((dPage?.height || 0) * scale)} px · ${inches(
    dPage?.width || 0,
  )} × ${inches(dPage?.height || 0)} in`

  const pdfHint = dLayouts.length > 1 ? `All ${dLayouts.length} pages, ready to print or email` : 'Ready to print or email'

  function run(command: string) {
    setOpen(false)
    if (command === 'png') return toImage()
    if (command === 'pdf') return toPdf()
    if (command === 'pptx-editable') return toPowerPoint('editable')
    if (command === 'pptx-picture') return toPowerPoint('picture')
  }

  /** Everything below shares one guard, one progress bar and one error path. */
  async function runExport(work: () => Promise<void>, done: string) {
    if (busy) return
    if ((widgetState.dLayouts || []).length === 0) {
      message({ message: 'There is nothing to export yet.', type: 'warning' })
      return
    }

    setBusy(true)
    try {
      await work()
      onProgress({ downloadPercent: 100, downloadText: done, downloadMsg: '' })
    } catch (e: any) {
      console.error('[export] failed', e)
      onProgress({ downloadPercent: 0, downloadText: '' })
      message({ message: e?.message || 'Sorry, that export did not work. Please try again.', type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  /**
   * The image export lives on HeaderOptions, which the File menu shares, so the
   * chosen quality is handed to it rather than a second copy being kept here.
   */
  function toImage() {
    onSelect('download', scale)
  }

  function toPdf() {
    const pages = widgetState.dLayouts || []
    return runExport(async () => {
      const title = getTitle?.() || 'Untitled design'
      onProgress({ downloadPercent: 1, downloadText: 'Preparing your PDF' })
      await withPageRenderer((renderer) =>
        exportPdf(pages as any, {
          title,
          scale,
          renderPage: renderer.renderPage,
          onProgress: (percent: number, msg: string) => onProgress({ downloadPercent: percent, downloadText: msg }),
        }),
      )
      message({ message: `Exported ${pages.length} page${pages.length === 1 ? '' : 's'} as a PDF.`, type: 'success' })
    }, 'Your PDF has been downloaded')
  }

  function toPowerPoint(mode: PptxMode) {
    const pages = widgetState.dLayouts || []
    return runExport(async () => {
      const title = getTitle?.() || 'Untitled design'
      onProgress({ downloadPercent: 1, downloadText: 'Preparing your slides' })
      await withPageRenderer(async (renderer) => {
        await exportPptx(pages as any, {
          title,
          mode,
          renderPage: renderer.renderPage,
          renderWidget: renderer.renderWidget,
          onProgress: (percent: number, msg: string) => onProgress({ downloadPercent: percent, downloadText: msg }),
        })
      })
      message({ message: `Exported ${pages.length} slide${pages.length === 1 ? '' : 's'}.`, type: 'success' })
    }, 'Your PowerPoint file has been downloaded')
  }

  return (
    <div className="export-menu">
      <Button className="export-btn" type="primary" disabled={busy} onClick={toImage}>
        {!busy ? <i className="iconfont icon-download export-btn__icon" /> : null}
        Export
      </Button>
      <Dropdown
        placement="bottom-end"
        open={open}
        onOpenChange={(next) => !busy && setOpen(next)}
        menuClassName="export-menu__list"
        menu={
          <>
            <div className="quality" onClick={(e) => e.stopPropagation()}>
              <div className="quality__label">Quality — for image and PDF</div>
              <div className="quality__choices">
                {SCALES.map((option) => (
                  <button
                    key={option.scale}
                    type="button"
                    className={cx('quality__btn', { 'is-on': scale === option.scale })}
                    onClick={() => setScale(option.scale)}
                  >
                    {option.name}{' '}
                    <span className="quality__dpi">{option.scale * DESIGN_DPI} DPI</span>
                  </button>
                ))}
              </div>
              <div className="quality__size">{sizeHint}</div>
            </div>

            <DropdownItem divided onSelect={() => run('png')}>
              <div className="opt">
                <span className="opt__name">Image</span>
                <span className="opt__hint">A PNG picture of this page</span>
              </div>
            </DropdownItem>
            <DropdownItem onSelect={() => run('pdf')}>
              <div className="opt">
                <span className="opt__name">PDF</span>
                <span className="opt__hint">{pdfHint}</span>
              </div>
            </DropdownItem>
            <DropdownItem divided onSelect={() => run('pptx-editable')}>
              <div className="opt">
                <span className="opt__name">PowerPoint</span>
                <span className="opt__hint">One slide per page, text stays editable</span>
              </div>
            </DropdownItem>
            <DropdownItem onSelect={() => run('pptx-picture')}>
              <div className="opt">
                <span className="opt__name">PowerPoint (exact copy)</span>
                <span className="opt__hint">Each page as a picture, nothing editable</span>
              </div>
            </DropdownItem>
          </>
        }
      >
        <Button className="export-caret" type="primary" disabled={busy}>
          <i className="iconfont icon-down" />
        </Button>
      </Dropdown>
    </div>
  )
}
