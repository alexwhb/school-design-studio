import { useEffect, useRef, useState } from 'react'
import { SearchIcon } from '@/components/ui/icons'
import { cx } from '@/utils/dom'
import './searchHeader.less'

type Props = {
  value?: string
  placeholder?: string
  /** Search as you type, rather than waiting for Enter. */
  live?: boolean
  onChange?: (value: string) => void
  onSearch?: (value: string) => void
}

const LIVE_DELAY = 200

/**
 * The search well at the top of a browsing panel.
 *
 * Its own markup rather than an Element Plus input: this is a well — a filled
 * box with a glyph in it — not a bordered field, and the two look nothing alike
 * once Element Plus has had its say about padding and height.
 */
export default function SearchHeader({ value, placeholder, live, onChange, onSearch }: Props) {
  const [searchValue, setSearchValue] = useState(value || '')
  const [focused, setFocused] = useState(false)
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

  return (
    <div className={cx('search-well', { 'search-well--focus': focused })}>
      <SearchIcon className="search-well__glyph" width={14} height={14} />
      <input
        className="search-well__input"
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
        <button
          type="button"
          className="search-well__clear"
          aria-label="Clear the search"
          onClick={() => {
            update('')
            submit()
          }}
        >
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M4 4l8 8M12 4l-8 8" />
          </svg>
        </button>
      ) : null}
    </div>
  )
}
