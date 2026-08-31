import { useEffect, useMemo, useRef, useState } from 'react'
import Popover from '@/components/ui/Popover'
import Tabs from '@/components/ui/Tabs'
import { cx } from '@/utils/dom'
import './valueSelect.less'

type Props = {
  label?: string
  value?: Record<string, any> | string | number
  suffix?: string
  data: Record<string, any> | any[]
  disable?: boolean
  inputWidth?: string
  readonly?: boolean
  step?: number
  onChange?: (value: Record<string, any> | string | number) => void
  onFinish?: (value: Record<string, any> | string | number) => void
}

export default function ValueSelect({
  label = '',
  value = {},
  suffix = '',
  data = {},
  disable = true,
  inputWidth = '80px',
  readonly = false,
  step = 1,
  onChange,
  onFinish,
}: Props) {
  const isList = Array.isArray(data)
  const groupKeys = useMemo(() => (isList ? [] : Object.keys(data)), [data, isList])
  const [activeTab, setActiveTab] = useState('')
  const [innerValue, setInnerValue] = useState<any>('')
  const [inputBorder, setInputBorder] = useState(false)
  const [open, setOpen] = useState(false)
  const tagText = useRef('')

  useEffect(() => {
    if (isList) return
    if (groupKeys.length && !groupKeys.includes(activeTab)) setActiveTab(groupKeys[0])
  }, [groupKeys, activeTab, isList])

  useEffect(() => {
    setInnerValue(typeof value === 'object' ? (value as any).alias : value)
  }, [value])

  function selectItem(item: any) {
    const next = typeof item === 'object' ? item.alias : item
    if (innerValue !== next) {
      setInnerValue(next)
      onFinish?.(item)
    }
    setOpen(false)
  }

  function inputText(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value
    setInnerValue(next)
    setTimeout(() => {
      onFinish?.(next)
    }, 100)
  }

  function opNumber(e: React.KeyboardEvent) {
    e.stopPropagation()
    if (typeof innerValue !== 'number') return
    if (e.keyCode === 38) onChange?.(parseInt(`${value}` ?? '0', 10) + step)
    if (e.keyCode === 40) {
      let next = parseInt(`${value}` ?? '0', 10) - step
      if (next < 0) next = 0
      onChange?.(next)
    }
  }

  const renderList = (items: any[]) => (
    <ul className="list-ul">
      {items.map((listItem: any) => {
        const key = typeof listItem === 'object' ? listItem.alias : listItem
        return (
          <li key={key} className={cx({ active: listItem == innerValue })} onClick={() => selectItem(listItem)}>
            {listItem.preview ? (
              <img className="preview" src={listItem.preview} alt="preview" />
            ) : (
              <span style={typeof listItem === 'object' ? { fontFamily: `'${listItem.value}'` } : undefined}>
                {(typeof listItem === 'object' ? listItem.alias : listItem) + suffix}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )

  const content = isList ? (
    renderList(data as any[])
  ) : (
    <div className="tabs-wrap">
      <Tabs
        value={activeTab}
        stretch={false}
        onChange={setActiveTab}
        items={groupKeys.map((key) => ({ name: key, label: key }))}
      >
        {renderList(((data as Record<string, any>)[activeTab] as any[]) || [])}
      </Tabs>
    </div>
  )

  return (
    <div className="value-select" style={{ width: inputWidth }}>
      {label ? <p className="input-label">{label}</p> : null}
      <Popover placement="bottom-end" width="auto" open={open} onOpenChange={setOpen} content={content}>
        <div className={cx('input-wrap', { active: inputBorder })} style={{ width: inputWidth }}>
          <input
            style={{ fontFamily: typeof value === 'object' ? (value as any).value : undefined }}
            className={cx('real-input', { disable: !disable })}
            readOnly={readonly}
            type="text"
            value={innerValue}
            onChange={inputText}
            onFocus={() => {
              setInputBorder(true)
              tagText.current = innerValue
            }}
            onBlur={() => {
              setInputBorder(false)
              if (innerValue !== tagText.current) onFinish?.(innerValue)
            }}
            onKeyDown={opNumber}
          />
          <div className="op-btn">
            <i className="iconfont icon-down1" />
          </div>
        </div>
      </Popover>
    </div>
  )
}
