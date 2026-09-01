import { useMemo, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import './tabs.less'

type Props = {
  value: string
  labels: string[]
  onChange: (value: string) => void
  children?: ReactNode
}

export default function Tabs({ value, labels, onChange, children }: Props) {
  const index = Math.max(0, labels.indexOf(value))
  const tabWidth = labels.length ? 100 / labels.length : 0
  const sliderStyle = useMemo(() => ({ width: `${tabWidth}%`, left: `${tabWidth * index}%` }), [tabWidth, index])

  return (
    <div className="my-tabs">
      <div className="my-tabs__header">
        <div className="my-tabs__header-shell">
          {labels.map((label) => (
            <div key={label} className={cx('my-tab__title', { 'my-active': label === value })} onClick={() => onChange(label)}>
              {label}
            </div>
          ))}
          <div className="my-tab__slider" style={sliderStyle} />
        </div>
      </div>
      <div className="my-tabs__content">{children}</div>
    </div>
  )
}
