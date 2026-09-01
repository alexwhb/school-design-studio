import { useEffect, useState } from 'react'
import { CloseIcon } from '@/components/ui/icons'
import './downloadProgress.less'

type Props = {
  percent: number
  text?: string
  cancelText?: string
  msg?: string
  onCancel?: () => void
  onDone?: () => void
}

export default function DownloadProgress({ percent, text = '', cancelText = '', msg = '', onCancel }: Props) {
  const [hide, setHide] = useState(false)

  useEffect(() => {
    if (percent >= 100) setHide(false)
  }, [percent])

  if (!percent) return null

  const cancel = () => {
    onCancel?.()
    setHide(false)
  }

  return (
    <div className="mask ds-download-progress" style={{ display: hide ? 'none' : undefined }}>
      <div className="content">
        <div className="tool">
          {percent < 100 ? (
            <div className="backstage" onClick={() => setHide(true)}>
              <span style={{ marginLeft: '0.4rem' }}>Download in the background</span>
            </div>
          ) : (
            <CloseIcon className="backstage" width={20} height={20} onClick={cancel} />
          )}
        </div>
        <div className="text">{text}</div>
        <div className="el-progress el-progress--line" style={{ width: '100%' }}>
          <div className="el-progress-bar">
            <div className="el-progress-bar__outer" style={{ height: '6px' }}>
              <div className="el-progress-bar__inner" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
        {percent < 100 ? (
          <div className="text btn" onClick={cancel}>
            {cancelText}
          </div>
        ) : null}
        <div className="text info">{msg}</div>
        {percent >= 100 ? (
          <div className="success" aria-hidden="true">
            {/* Drawn here rather than fetched: this used to hotlink a PNG from
                the upstream project's asset host, so the one moment the app says
                "done" depended on a third-party CDN being up. */}
            <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="24" cy="24" r="21" opacity="0.25" />
              <path d="M14 24.5 21 31.5 34 17.5" />
            </svg>
          </div>
        ) : null}
      </div>
    </div>
  )
}
