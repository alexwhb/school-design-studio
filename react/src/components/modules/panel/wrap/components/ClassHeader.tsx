import type { ReactNode } from 'react'
import './classHeader.less'

export type TClassHeaderTypeData = {
  name: string
}

type Props = {
  types?: TClassHeaderTypeData[]
  isBack?: boolean
  onSelect?: (item: any) => void
  onBack?: () => void
  renderSection?: (index: number) => ReactNode
  children?: ReactNode
}

export default function ClassHeader({ types, isBack, onSelect, onBack, renderSection, children }: Props) {
  if (isBack) {
    return (
      <span className="types__header-back" onClick={onBack}>
        <i className="iconfont icon-right" />
        {children}
      </span>
    )
  }
  return (
    <div className="content__wrap">
      {(types || []).map((t, ti) => (
        <div key={ti + 't'}>
          <div className="types__header" onClick={() => onSelect?.(t)}>
            <span style={{ flex: 1 }}>{t.name}</span>
            <span className="types__header-more">
              All<i className="iconfont icon-right" />
            </span>
          </div>
          {renderSection?.(ti)}
        </div>
      ))}
    </div>
  )
}
