/**
 * The heading over one block of a browsing panel.
 *
 * Lighter than the settings panel's `PanelSection`: no hairline and nothing to
 * collapse, because a browsing panel's sections are a way of naming what you
 * are looking at rather than a set of controls you fold away.
 */
import type { ReactNode } from 'react'
import './panelEyebrow.less'

type Props = {
  label: ReactNode
  /** A count or an aside, when there is nothing to click. */
  note?: ReactNode
  onAction?: () => void
  actionLabel?: string
}

export default function PanelEyebrow({ label, note, onAction, actionLabel = 'See all' }: Props) {
  return (
    <div className="panel-eyebrow">
      <span className="panel-eyebrow__label">{label}</span>
      {onAction ? (
        <button type="button" className="panel-eyebrow__more" onClick={onAction}>
          {actionLabel}
        </button>
      ) : note ? (
        <span className="panel-eyebrow__note">{note}</span>
      ) : null}
    </div>
  )
}
