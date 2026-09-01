import type React from 'react'
import Tooltip from '@/components/ui/Tooltip'
import { cx } from '@/utils/dom'
import './iconItemSelect.less'

export type TIconItemSelectData = {
  key?: string
  select?: boolean
  extraIcon?: boolean
  tip?: string
  icon?: string
  /** An inline icon, for the buttons the icon fonts have no glyph for. */
  Icon?: React.ComponentType<{ className?: string }>
  /** Greyed out and inert: the action exists but cannot apply to what is selected. */
  disabled?: boolean
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
    if (item.disabled) return
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
              <li className={cx('list-item', { active: !!item.select, disabled: !!item.disabled })} aria-label={item.tip} onClick={() => selectItem(item)}>
                {item.Icon ? <item.Icon className="svg-icon" /> : <i className={`${item.extraIcon ? 'icon' : 'iconfont'} ${item.icon}`} />}
              </li>
            </Tooltip>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
