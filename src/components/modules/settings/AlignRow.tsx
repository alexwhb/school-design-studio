/**
 * The align row: what a thing lines up with across the page, and what it lines
 * up with down it, as two groups either side of a hairline.
 *
 * Six identical buttons in a row read as one list of six choices, and the
 * "align right" / "align top" pair in the middle of it look related. Split,
 * each group is three answers to one question.
 */
import { useMemo } from 'react'
import alignIconList from '@/assets/data/AlignListData'
import IconItemSelect, { type TIconItemSelectData } from './IconItemSelect'
import { DistributeHorizontalIcon, DistributeVerticalIcon } from '@/components/ui/icons'
import { cx } from '@/utils/dom'
import './alignRow.less'

type Props = {
  onFinish: (item: TIconItemSelectData) => void
  /** Evening out the gaps needs a gap on either side of something, so three widgets. */
  distribute?: boolean
  distributeDisabled?: boolean
  className?: string
}

export default function AlignRow({ onFinish, distribute, distributeDisabled, className }: Props) {
  const [across, down] = useMemo(() => {
    const horizontal: TIconItemSelectData[] = alignIconList.filter((item) => item.axis === 'horizontal')
    const vertical: TIconItemSelectData[] = alignIconList.filter((item) => item.axis === 'vertical')
    if (distribute) {
      horizontal.push({ key: 'distribute', Icon: DistributeHorizontalIcon, tip: 'Distribute horizontally', value: 'horizontal', disabled: distributeDisabled })
      vertical.push({ key: 'distribute', Icon: DistributeVerticalIcon, tip: 'Distribute vertically', value: 'vertical', disabled: distributeDisabled })
    }
    return [horizontal, vertical]
  }, [distribute, distributeDisabled])

  return (
    <div className={cx('align-row', className || '')}>
      <IconItemSelect className="align-row__group" data={across} onFinish={onFinish} />
      <span className="align-row__split" aria-hidden="true" />
      <IconItemSelect className="align-row__group" data={down} onFinish={onFinish} />
    </div>
  )
}
