import { useRef, type ReactNode } from 'react'
import { saveUpload } from '@/common/methods/localUploads'
import useNotification from '@/common/methods/notification'
import './uploader.less'

export type TModelData = {
  num?: string | number
  ratio?: string
}

export type TUploadDoneData = {
  width: number
  height: number
  url: string
  id?: string
  title?: string
}

type Props = {
  value?: TModelData
  hold?: boolean
  accept?: string
  drag?: boolean
  className?: string
  style?: React.CSSProperties
  onChange?: (data: TModelData) => void
  onDone?: (data: TUploadDoneData) => void
  onLoad?: (file: File) => void
  children?: ReactNode
}

export default function Uploader({ value = {}, hold = false, accept = 'image/*', drag = false, className, style, onChange, onDone, onLoad, children }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const uploading = useRef(false)
  const timer = useRef<any>(null)
  const uploadList = useRef<File[]>([])
  const index = useRef(0)
  const count = useRef(0)
  const valueRef = useRef(value)
  valueRef.current = value

  const updatePercent = (p?: number | null) => {
    const num = typeof p === 'number' ? String(p) : p
    const percent: TModelData = { ...valueRef.current }
    percent.num = num ? Number(num).toFixed(0) : percent.num
    percent.ratio = count.current ? `${index.current} / ${count.current}` : ''
    onChange?.(percent)
  }

  const handleRemove = () => {
    uploadList.current.length > 0 && uploadList.current.splice(0, 1)
  }

  const uploadQueue = async () => {
    if (uploading.current) return
    uploading.current = true
    const file = uploadList.current[0]
    if (file) {
      if (file.size > 40 * 1024 * 1024) {
        useNotification('That image is too big', 'Please use a picture under 40MB.', { type: 'error', position: 'bottom-left' })
      } else {
        updatePercent(0)
        try {
          const saved = await saveUpload(file)
          useNotification('Uploaded', saved.title, { position: 'bottom-left' })
          onDone?.({ id: saved.id, width: saved.width, height: saved.height, url: saved.url, title: saved.title })
        } catch (error) {
          const quota = error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
          useNotification(quota ? 'No room left for uploads' : 'That image could not be added', quota ? 'Delete some uploads and try again.' : (error as Error)?.message || 'The file could not be read.', { type: 'error', position: 'bottom-left' })
        }
      }
      uploading.current = false
      handleRemove()
      index.current++
      updatePercent(null)
      uploadQueue()
    } else {
      uploading.current = false
      timer.current = setTimeout(() => {
        index.current = count.current = 0
        updatePercent(0)
      }, 3000)
    }
  }

  const upload = (file: File) => {
    if (hold) {
      onLoad?.(file)
      return
    }
    uploadList.current.push(file)
    clearTimeout(timer.current)
    count.current++
    updatePercent(null)
    uploadQueue()
  }

  return (
    <div
      className={className ? `el-upload el-upload--text ${className}` : 'el-upload el-upload--text'}
      style={style}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => drag && e.preventDefault()}
      onDrop={(e) => {
        if (!drag) return
        e.preventDefault()
        Array.from(e.dataTransfer.files || []).forEach(upload)
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        style={{ display: 'none' }}
        onChange={(e) => {
          const files = Array.from(e.target.files || [])
          files.forEach(upload)
          e.target.value = ''
        }}
      />
      {drag ? <div className="el-upload-dragger">{children}</div> : children}
    </div>
  )
}
