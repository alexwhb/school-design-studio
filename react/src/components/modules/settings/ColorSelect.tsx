import { useEffect, useMemo, useState } from 'react'
import ColorPicker, { type ColorChangeData } from '@/packages/color-picker/ColorPicker'
import Popover from '@/components/ui/Popover'
import { setShowMoveable } from '@/store/control'
import './colorSelect.less'

export type { ColorChangeData as colorChangeData }

type Props = {
  label?: string
  value?: string
  width?: string
  modes?: string[]
  onValueChange?: (value: string) => void
  onFinish?: (value: string) => void
  onChange?: (data: ColorChangeData) => void
}

export default function ColorSelect({ label = '', value = '', width = '100%', modes = ['Solid'], onValueChange, onChange }: Props) {
  const [innerColor, setInnerColor] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!value) return
    const next = value + (value.length === 7 ? 'ff' : '')
    setInnerColor((prev) => (prev === next ? prev : next))
  }, [value])

  const readableColor = useMemo(() => {
    const current = innerColor || ''
    if (!current) return 'None'
    if (current.includes('gradient')) return 'Gradient'
    if (current.startsWith('url')) return 'Image'
    const hex = current.replace(/^#/, '').toUpperCase()
    return '#' + (hex.length === 8 && hex.endsWith('FF') ? hex.slice(0, 6) : hex)
  }, [innerColor])

  function handleValueChange(next: string) {
    setInnerColor(next)
    onValueChange?.(next)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setShowMoveable(false)
    else setShowMoveable(true)
  }

  return (
    <div className="color__select" style={{ width }}>
      {label ? <p className="input-label">{label}</p> : null}
      <div className="content">
        <Popover
          placement="left-end"
          width="auto"
          open={open}
          onOpenChange={handleOpenChange}
          content={<ColorPicker value={innerColor} modes={modes} onValueChange={handleValueChange} onChange={onChange} />}
        >
          <div className="color__field">
            <span className="color__chip transparent-bg">
              <span className="color__chip-fill" style={{ background: innerColor }} />
            </span>
            <span className="color__value">{readableColor}</span>
          </div>
        </Popover>
      </div>
    </div>
  )
}
