import Button from '@/components/ui/Button'
import Dialog from '@/components/ui/Dialog'
import type { DesignIssue } from '@/common/methods/accessibility/checkDesign'
import { selectWidget } from '@/store/widget/select'
import { showPage } from '@/store/widget/pages'
import './checkBeforeDownload.less'

type Props = {
  issues: DesignIssue[] | null
  onDownload: () => void
  onClose: () => void
}

/** Enough to act on. Past this the list is a wall, and the first few say what kind of thing is wrong. */
const SHOWN = 8

/**
 * What the check found, before the studio's own Download goes ahead.
 *
 * Standalone only. Embedded, the host decides when to ask, through the
 * handle's `checkDesign`. Nothing here stops a download: somebody printing a
 * draft for themselves does not need a lecture, so "Download anyway" is
 * always one click away, and "Show me" takes them to the page and selects
 * the thing.
 */
export default function CheckBeforeDownload({ issues, onDownload, onClose }: Props) {
  const list = issues || []

  function show(issue: DesignIssue) {
    onClose()
    showPage(issue.page)
    selectWidget({ uuid: issue.widgetId })
  }

  return (
    <Dialog
      open={list.length > 0}
      onOpenChange={(open) => !open && onClose()}
      title="Before you download"
      width={480}
      className="check-before-download"
      footer={
        <>
          <Button onClick={() => show(list[0])}>Show me</Button>
          <Button type="primary" onClick={onDownload}>
            Download anyway
          </Button>
        </>
      }
    >
      <p className="check-before-download__lead">{list.length === 1 ? 'One thing to look at first:' : `${list.length} things to look at first:`}</p>
      <ul className="check-before-download__list">
        {list.slice(0, SHOWN).map((issue, index) => (
          <li key={`${issue.widgetId}-${issue.kind}-${index}`} className="check-before-download__item" data-kind={issue.kind}>
            <span className="check-before-download__page">Page {issue.page + 1}</span>
            <span className="check-before-download__message">{issue.message}</span>
            <button type="button" className="check-before-download__show" onClick={() => show(issue)}>
              Show me
            </button>
          </li>
        ))}
      </ul>
      {list.length > SHOWN ? <p className="check-before-download__more">And {list.length - SHOWN} more.</p> : null}
    </Dialog>
  )
}
