import Tooltip from '@/components/ui/Tooltip'
import { cx } from '@/utils/dom'
import './iconItemSelect.less'

export type TIconItemSelectData = {
  key?: string
  select?: boolean
  extraIcon?: boolean
  tip?: string
  icon?: string
  value?: string | number | number[] | string[]
}

type Props = {
  label?: string
  data: TIconItemSelectData[]
  className?: string
  onFinish?: (item: TIconItemSelectData) => void
}

export default function IconItemSelect({ label = '', data, className, onFinish }: Props) {
  function selectItem(item: TIconItemSelectData) {
    if (typeof item.select !== 'undefined') {
      item.select = !item.select
    }
    onFinish?.(item)
    item.key === 'textAlign' && (item.select = true)
  }

  return (
    <div className={cx('icon-item-select', className || '')}>
      {label ? <span className="label">{label}</span> : null}
      {data ? (
        <ul className="list btn__bar flex">
          {data.map((item, index) => (
            <Tooltip key={index} content={item.tip} placement="top" showAfter={300}>
              <li className={cx('list-item', { active: !!item.select })} onClick={() => selectItem(item)}>
                <i className={`${item.extraIcon ? 'icon' : 'iconfont'} ${item.icon}`} />
              </li>
            </Tooltip>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
