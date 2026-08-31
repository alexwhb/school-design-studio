import { useState } from 'react'
import { useSnapshot } from 'valtio'
import Button from '@/components/ui/Button'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import message from '@/components/ui/message'
import exportPptx, { type PptxMode } from '@/common/methods/export/exportPptx'
import { withPageRenderer } from '@/common/methods/export/renderPage'
import { widgetState } from '@/store/state'
import './exportMenu.less'

type Props = {
  getTitle?: () => string
  onSelect: (name: string) => void
  onProgress: (data: { downloadPercent: number; downloadText: string; downloadMsg?: string }) => void
}

export default function ExportMenu({ getTitle, onSelect, onProgress }: Props) {
  const { dLayouts } = useSnapshot(widgetState)
  const [busy, setBusy] = useState(false)

  function emitDownload() {
    onSelect('download')
  }

  function run(command: string) {
    if (command === 'png') return emitDownload()
    if (command === 'pptx-editable') return toPowerPoint('editable')
    if (command === 'pptx-picture') return toPowerPoint('picture')
  }

  async function toPowerPoint(mode: PptxMode) {
    if (busy) return
    const pages = widgetState.dLayouts || []
    if (pages.length === 0) {
      message({ message: 'There is nothing to export yet.', type: 'warning' })
      return
    }

    setBusy(true)
    const title = getTitle?.() || 'Untitled design'
    onProgress({ downloadPercent: 1, downloadText: 'Preparing your slides' })

    try {
      await withPageRenderer(async (renderer) => {
        await exportPptx(pages as any, {
          title,
          mode,
          renderPage: renderer.renderPage,
          renderWidget: renderer.renderWidget,
          onProgress: (percent: number, msg: string) => onProgress({ downloadPercent: percent, downloadText: msg }),
        })
      })
      onProgress({ downloadPercent: 100, downloadText: 'Your PowerPoint file has been downloaded', downloadMsg: '' })
      message({ message: `Exported ${pages.length} slide${pages.length === 1 ? '' : 's'}.`, type: 'success' })
    } catch (e: any) {
      console.error('[export] PowerPoint export failed', e)
      onProgress({ downloadPercent: 0, downloadText: '' })
      message({ message: e?.message || 'Sorry, that export did not work. Please try again.', type: 'error' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="export-menu">
      <Button className="export-btn" type="primary" disabled={busy} onClick={emitDownload}>
        {!busy ? <i className="iconfont icon-download export-btn__icon" /> : null}
        Export
      </Button>
      <Dropdown
        placement="bottom-end"
        menu={
          <>
            <DropdownItem onSelect={() => run('png')}>
              <div className="opt">
                <span className="opt__name">Image</span>
                <span className="opt__hint">A PNG picture of this page</span>
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
