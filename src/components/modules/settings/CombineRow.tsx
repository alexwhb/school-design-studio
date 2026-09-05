/**
 * The four ways of making one shape out of several: add, subtract, intersect
 * and exclude, named and ordered as Adobe XD names and orders them.
 *
 * They sit with Group rather than with the alignment icons because they answer
 * the same question Group does — what should these several things be? — and
 * because, like Group, they are only ever offered for a selection of more than
 * one.
 *
 * A selection holding anything that is not a drawn shape leaves all four greyed
 * out rather than gone. Photographs, text, tables, QR codes and groups have no
 * outline to combine, and a button that disappears whenever the selection
 * changes teaches nobody why.
 */
import { recordHistory } from '@/common/hooks/history'
import { ExcludeIcon, IntersectIcon, SubtractIcon, UnionIcon } from '@/components/ui/icons'
import { combineShapes } from '@/store/widget'
import type { TBooleanOp } from '../widgets/shape/booleanShapes'
import IconItemSelect, { type TIconItemSelectData } from './IconItemSelect'
import './combineRow.less'

type Props = {
  /** Something in the selection is not a shape, so there is nothing to combine. */
  disabled?: boolean
}

const OPERATIONS: { op: TBooleanOp; label: string; Icon: TIconItemSelectData['Icon'] }[] = [
  { op: 'unite', label: 'Add', Icon: UnionIcon },
  { op: 'subtract', label: 'Subtract', Icon: SubtractIcon },
  { op: 'intersect', label: 'Intersect', Icon: IntersectIcon },
  { op: 'exclude', label: 'Exclude overlap', Icon: ExcludeIcon },
]

export default function CombineRow({ disabled }: Props) {
  const items: TIconItemSelectData[] = OPERATIONS.map(({ op, label, Icon }) => ({
    key: op,
    value: op,
    Icon,
    tip: disabled ? `${label} — shapes only` : label,
    disabled,
  }))

  return (
    <IconItemSelect
      className="combine-row"
      label="Combine"
      data={items}
      // Combining is committed all at once from a button, so it marks its own
      // ends: the press and the release the undo stack is otherwise built from
      // never reach the document while a panel control has the pointer.
      onFinish={(item) => recordHistory(() => combineShapes(item.value as TBooleanOp))}
    />
  )
}
