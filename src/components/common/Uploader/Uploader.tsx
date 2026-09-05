import { useRef, type ReactNode } from 'react'
import { IMAGE_UPLOAD_ACCEPT, uploadImageFile, type TUploadDoneData } from '@/common/methods/placeImageFile'
import './uploader.less'

export type TModelData = {
  num?: string | number
  ratio?: string
}

// Defined beside the uploading itself, and re-exported here because half the
// editor imports it from this file.
export type { TUploadDoneData }

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
      updatePercent(0)
      // The size cap, the type allowlist and every failure notice live in
      // `uploadImageFile`, which is also what a file dropped on the canvas goes
      // through. This queue's job is the progress readout and nothing else.
      const saved = await uploadImageFile(file)
      if (saved) onDone?.(saved)
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
