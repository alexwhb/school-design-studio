import { useEffect, useRef, useState, type ReactNode } from 'react'
import NumberInput from '@/components/modules/settings/NumberInput'
import Tooltip from '@/components/ui/Tooltip'
import { cx } from '@/utils/dom'
import './sizeEditor.less'

type Props = {
  params: { width: number; height: number; [key: string]: any }
  onChange?: (next: { width: number; height: number }) => void
  className?: string
  children?: ReactNode
}

function isNumber(val: any) {
  return typeof val === 'number'
}

export default function SizeEditor({ params, onChange, className, children }: Props) {
  const [lockRatio, setLockRatio] = useState(false)
  const scale = useRef(0)
  const temp = useRef({ width: 0, height: 0 })
  const timer = useRef<any>(null)
  const prev = useRef({ width: params.width, height: params.height })

  function setChange() {
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (temp.current.width > 0 && temp.current.height === 0) {
        onChange?.({ width: params.width, height: params.width / scale.current })
      }
      if (temp.current.height > 0 && temp.current.width === 0) {
        onChange?.({ width: params.height * scale.current, height: params.height })
      }
      if (temp.current.width > 0 && temp.current.height > 0) {
        temp.current = { width: 0, height: 0 }
      }
    }, 300)
  }

  useEffect(() => {
    if (scale.current && isNumber(params.width) && isNumber(prev.current.width) && params.width !== prev.current.width) {
      temp.current.width === 0 && (temp.current.width = params.width)
      setChange()
    }
    prev.current.width = params.width
  }, [params.width])

  useEffect(() => {
    if (scale.current && isNumber(params.height) && isNumber(prev.current.height) && params.height !== prev.current.height) {
      temp.current.height === 0 && (temp.current.height = params.height)
      setChange()
    }
    prev.current.height = params.height
  }, [params.height])

  function changeRatio() {
    const next = !lockRatio
    setLockRatio(next)
    scale.current = next ? params.width / params.height : 0
  }

  return (
    <div className={cx('position-size', className || '')}>
      <NumberInput value={params.width} label="W" maxValue={5000} onChange={(v) => onChange?.({ width: Number(v), height: params.height })} />
      <Tooltip content={lockRatio ? 'Lock aspect ratio' : 'Change freely'} placement="top" showAfter={300}>
        <i onClick={changeRatio} className={cx('icon', lockRatio ? 'sd-db' : 'sd-fdb')} />
      </Tooltip>
      <NumberInput value={params.height} label="H" maxValue={5000} onChange={(v) => onChange?.({ width: params.width, height: Number(v) })} />
      {children}
    </div>
  )
}
