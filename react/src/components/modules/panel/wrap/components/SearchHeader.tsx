import { useEffect, useRef, useState } from 'react'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import { cx } from '@/utils/dom'
import './searchHeader.less'

export type TMaterialCatesData = { id: string | number; name: string }

type Props = {
  type?: string
  value?: string
  placeholder?: string
  live?: boolean
  onChange?: (value: string) => void
  onCateChange?: (data: TMaterialCatesData) => void
  onSearch?: (value: string) => void
}

const LIVE_DELAY = 200

export default function SearchHeader({ type, value, placeholder, live, onChange, onCateChange, onSearch }: Props) {
  const [searchValue, setSearchValue] = useState(value || '')
  const [currentIndex, setCurrentIndex] = useState<number | string>(1)
  const materialCates: TMaterialCatesData[] = type != 'none' ? [{ id: 0, name: 'Sample templates' }] : []
  const liveTimer = useRef<any>(null)
  const searchRef = useRef(searchValue)
  searchRef.current = searchValue

  useEffect(() => {
    if (value !== undefined && value !== searchValue) {
      setSearchValue(value)
    }
  }, [value])

  function submit() {
    clearTimeout(liveTimer.current)
    onSearch?.(searchRef.current.trim())
  }

  function update(next: string) {
    setSearchValue(next)
    searchRef.current = next
    onChange?.(next)
    if (!live) return
    clearTimeout(liveTimer.current)
    liveTimer.current = setTimeout(submit, LIVE_DELAY)
  }

  function action(cate: TMaterialCatesData) {
    cate.id && setCurrentIndex(cate.id)
    onCateChange?.(cate)
  }

  return (
    <div className="search__wrap">
      {type !== 'none' ? (
        <Dropdown
          placement="bottom-start"
          menu={
            <>
              {materialCates.map((cate) => (
                <DropdownItem key={cate.id} onSelect={() => action(cate)}>
                  <span className={cx('cate__text', { 'cate--select': +currentIndex === cate.id })}>{cate.name}</span>
                </DropdownItem>
              ))}
            </>
          }
        >
          <div className="search__type">
            <i className="iconfont icon-ego-caidan" />
          </div>
        </Dropdown>
      ) : null}

      <div className="el-input el-input--large search__input">
        <div className="el-input__wrapper">
          <span className="el-input__prefix">
            <span className="el-input__prefix-inner">
              <i className="iconfont icon-search" />
            </span>
          </span>
          <input
            className="el-input__inner"
            value={searchValue}
            placeholder={placeholder || 'Search'}
            onChange={(e) => update(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && submit()}
          />
        </div>
      </div>
    </div>
  )
}
