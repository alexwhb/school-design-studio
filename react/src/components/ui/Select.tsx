import { useState } from 'react'
import Popover from './Popover'
import { cx } from '@/utils/dom'
import { ArrowUpIcon } from './icons'

export type SelectOption = {
  label: string
  value: string | number
}

type Props = {
  value: string | number
  options: SelectOption[]
  className?: string
  onChange: (value: string | number) => void
}

export default function Select({ value, options, className, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const current = options.find((o) => o.value === value)

  return (
    <div className={cx('el-select', className || '')}>
      <Popover
        placement="bottom"
        width="auto"
        open={open}
        onOpenChange={setOpen}
        popperClass="el-select__popper"
        content={
          <div className="el-select-dropdown__list">
            {options.map((option) => (
              <div
                key={option.value}
                className={cx('el-select-dropdown__item', { selected: option.value === value })}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        }
      >
        <div className={cx('el-select__wrapper', { 'is-focused': open })}>
          <div className="el-select__selection">
            <span className="el-select__selected-item el-select__placeholder">
              <span>{current?.label ?? ''}</span>
            </span>
          </div>
          <div className="el-select__suffix">
            <i className={cx('el-icon', 'el-select__caret', 'el-select__icon', { 'is-reverse': open })}>
              <ArrowUpIcon />
            </i>
          </div>
        </div>
      </Popover>
    </div>
  )
}
