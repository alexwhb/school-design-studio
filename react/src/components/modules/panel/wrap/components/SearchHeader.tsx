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
  const [focused, setFocused] = useState(false)
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
        <div className={cx('el-input__wrapper', { 'is-focus': focused })}>
          <span className="el-input__prefix">
            <span className="el-input__prefix-inner">
              <i className="iconfont icon-search" />
            </span>
          </span>
          <input
            className="el-input__inner"
            value={searchValue}
            placeholder={placeholder || 'Search'}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => update(e.target.value)}
            onKeyUp={(e) => e.key === 'Enter' && submit()}
          />
          {/* Clearing runs the search again, so the list comes back rather than
              sitting on the results of a query that is no longer in the box. */}
          {searchValue ? (
            <span className="el-input__suffix">
              <span className="el-input__suffix-inner">
                <i
                  className="el-icon el-input__icon el-input__clear"
                  onClick={() => {
                    update('')
                    submit()
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024">
                    <path
                      fill="currentColor"
                      d="m466.752 512-90.496-90.496a32 32 0 0 1 45.248-45.248L512 466.752l90.496-90.496a32 32 0 1 1 45.248 45.248L557.248 512l90.496 90.496a32 32 0 1 1-45.248 45.248L512 557.248l-90.496 90.496a32 32 0 0 1-45.248-45.248z"
                    />
                    <path
                      fill="currentColor"
                      d="M512 896a384 384 0 1 0 0-768 384 384 0 0 0 0 768m0 64a448 448 0 1 1 0-896 448 448 0 0 1 0 896"
                    />
                  </svg>
                </i>
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
