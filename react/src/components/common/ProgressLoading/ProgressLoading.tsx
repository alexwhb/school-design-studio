import { useEffect } from 'react'
import './progressLoading.less'

type Props = {
  percent: number
  text?: string
  cancelText?: string
  msg?: string
  onCancel?: () => void
  onDone?: () => void
}

export default function ProgressLoading({ percent, text = '', cancelText = '', msg = '', onCancel, onDone }: Props) {
  useEffect(() => {
    if (percent >= 100) {
      const timer = setTimeout(() => onDone?.(), 1000)
      return () => clearTimeout(timer)
    }
  }, [percent, onDone])

  if (!percent) return null

  return (
    <div className="ds-progress-loading mask">
      <div className="content">
        <div className="text">{text}</div>
        <div className="el-progress el-progress--line" style={{ width: '100%' }}>
          <div className="el-progress-bar">
            <div className="el-progress-bar__outer" style={{ height: '6px' }}>
              <div className="el-progress-bar__inner" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
        <div className="text btn" onClick={onCancel}>
          {cancelText}
        </div>
        <div className="text info">{msg}</div>
      </div>
    </div>
  )
}
