import { useEffect, useMemo, useRef, useState } from 'react'
import Popover from '@/components/ui/Popover'
import { ChevronDownIcon } from '@/components/ui/icons'
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
  /** `underline` drops the box and the chevron, leaving a rule under the value. */
  variant?: 'boxed' | 'underline'
  className?: string
  onChange?: (value: Record<string, any> | string | number) => void
  onFinish?: (value: Record<string, any> | string | number) => void
}

export default function ValueSelect({ label = '', value = {}, suffix = '', data = {}, disable = true, inputWidth = '80px', readonly = false, step = 1, variant = 'boxed', className, onChange, onFinish }: Props) {
  const isList = Array.isArray(data)
  const groupKeys = useMemo(() => (isList ? [] : Object.keys(data)), [data, isList])
  const [innerValue, setInnerValue] = useState<any>('')
  const [inputBorder, setInputBorder] = useState(false)
  const [open, setOpen] = useState(false)
  const tagText = useRef('')
  const listRef = useRef<HTMLDivElement | null>(null)

  /**
   * Opens on the value the box already holds.
   *
   * The groups used to be tabs, so choosing one was also how you got to it. In
   * one list a family can be a long way down, and a menu that always opened on
   * the first group said nothing about what the box was set in.
   */
  useEffect(() => {
    if (!open) return
    const frame = requestAnimationFrame(() => {
      listRef.current?.querySelector('li.active')?.scrollIntoView({ block: 'nearest' })
    })
    return () => cancelAnimationFrame(frame)
  }, [open])

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
            {listItem.preview ? <img className="preview" src={listItem.preview} alt="preview" /> : <span style={typeof listItem === 'object' ? { fontFamily: `'${listItem.value}'` } : undefined}>{(typeof listItem === 'object' ? listItem.alias : listItem) + suffix}</span>}
          </li>
        )
      })}
    </ul>
  )

  /**
   * Grouped data is one scrolling list with its headings in place, not a tab
   * apiece: the tab strip ran off the side of the menu, taking the last
   * categories with it, and a heading that sticks as its group goes by cannot
   * run out of room the same way. The groups keep the order they were given in,
   * so the school's own fonts stay at the top.
   */
  const content = (
    <div className={cx('select-list', { 'is-grouped': !isList })} ref={listRef}>
      {isList
        ? renderList(data as any[])
        : groupKeys.map((key) => {
            const items = ((data as Record<string, any>)[key] as any[]) || []
            if (!items.length) return null
            return (
              <section key={key} className="select-list__group">
                <p className="select-list__name">{key}</p>
                {renderList(items)}
              </section>
            )
          })}
    </div>
  )

  return (
    <div className={cx('value-select', { 'is-underline': variant === 'underline' }, className || '')} style={{ width: inputWidth }}>
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
          {variant === 'underline' ? null : (
            <div className="op-btn">
              <ChevronDownIcon />
            </div>
          )}
        </div>
      </Popover>
    </div>
  )
}
