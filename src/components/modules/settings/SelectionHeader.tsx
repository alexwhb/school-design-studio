/**
 * What you have selected, at the top of the Design tab: what kind of thing it
 * is, what it is called, and the two things you do to it often enough that
 * finding them on a right-click menu is a step too many.
 *
 * The name is the layer list's name — see layerMeta — so the panel and the list
 * agree about what a thing is called.
 */
import { recordHistory } from '@/common/hooks/history'
import { DuplicateIcon, TrashIcon } from '@/components/ui/icons'
import Tooltip from '@/components/ui/Tooltip'
import { duplicateOne } from '@/store/widget/clone'
import { deleteWidget } from '@/store/widget/widget'
import type { TdWidgetData } from '@/store/types'
import { LayerBadge, layerLabel } from '../panel/components/layerMeta'
import './selectionHeader.less'

type Props = {
  element: TdWidgetData | Record<string, any>
  /** Anything the element wants said about itself — a photo's pixel size. */
  meta?: string
}

export default function SelectionHeader({ element, meta }: Props) {
  return (
    <div className="selection-header">
      <LayerBadge type={element.type} className="selection-header__badge" />
      <span className="selection-header__name">{layerLabel(element as TdWidgetData)}</span>
      {meta ? <span className="selection-header__meta">{meta}</span> : null}
      <div className="selection-header__actions">
        <Tooltip content="Duplicate" placement="top" showAfter={300}>
          <button type="button" className="selection-header__action" aria-label="Duplicate" onClick={() => recordHistory(duplicateOne)}>
            <DuplicateIcon />
          </button>
        </Tooltip>
        <Tooltip content="Delete" placement="top" showAfter={300}>
          <button type="button" className="selection-header__action" aria-label="Delete" onClick={() => deleteWidget()}>
            <TrashIcon />
          </button>
        </Tooltip>
      </div>
    </div>
  )
}
