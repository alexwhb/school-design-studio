import type { CSSProperties, ReactNode } from 'react'
import './innerToolBar.less'

export default function InnerToolBar({ style, children }: { style?: CSSProperties; children?: ReactNode }) {
  return (
    <div className="inner-tool-bar" style={style}>
      {children}
    </div>
  )
}
