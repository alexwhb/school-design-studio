import { useEffect, useMemo, useState } from 'react'
import { useSnapshot } from 'valtio'
import { brandState } from '@/common/methods/brandKit'
import { cx } from '@/utils/dom'
import ColorPicker, { type ColorChangeData } from '@/packages/color-picker/ColorPicker'
import Checkbox from '@/components/ui/Checkbox'
import Popover from '@/components/ui/Popover'
import { PencilIcon } from '@/components/ui/icons'
import { setShowMoveable } from '@/store/control'
import './colorSelect.less'

export type { ColorChangeData as colorChangeData }

/**
 * A solid colour as six lower-case hex digits, or nothing at all.
 *
 * Only solid and fully opaque colours are comparable: a gradient has no one
 * hex, and half a colour is not the colour. The alpha has to be looked at
 * rather than trimmed off the end, or #0000FF would have its blue taken for an
 * alpha and come out as #0000.
 */
function opaqueHex(color: string) {
  const value = (color || '').trim().toLowerCase()
  if (!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(value)) return ''
  if (value.length === 9 && value.slice(7) !== 'ff') return ''
  return value.slice(0, 7)
}

type Props = {
  label?: string
  value?: string
  width?: string
  modes?: string[]
  className?: string
  /** `row` is the settings-panel shape: a checkbox, a wide swatch, a name and a pencil. */
  variant?: 'field' | 'row'
  /** A row's checkbox, for the panels where the colour can be switched off entirely. */
  enabled?: boolean
  onEnabledChange?: (enabled: boolean) => void
  /** See Popover: for a swatch that colours a text selection. */
  keepOpenOnFocusOutside?: boolean
  onOpenChange?: (open: boolean) => void
  onValueChange?: (value: string) => void
  onFinish?: (value: string) => void
  onChange?: (data: ColorChangeData) => void
}

export default function ColorSelect({ label = '', value = '', width = '100%', modes = ['Solid'], className, variant = 'field', enabled, onEnabledChange, keepOpenOnFocusOutside, onOpenChange, onValueChange, onChange }: Props) {
  const [innerColor, setInnerColor] = useState('')
  const [open, setOpen] = useState(false)
  // Held here so it survives the popover closing; see ColorPicker.
  const [history, setHistory] = useState<string[]>([])
  // The school's colours, offered above the recent ones in every picker.
  const brandColors = useSnapshot(brandState).kit.colors
  const presets = useMemo(() => (brandColors.length ? [{ label: 'Brand', colors: brandColors.slice() }] : undefined), [brandColors])

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

  /**
   * Which of the school's colours this is, if it is one of them. Worth saying:
   * a hex on its own tells you nothing about whether the design is on-brand,
   * and the picker is the only other place that would have told you.
   */
  const brandName = useMemo(() => {
    const hex = opaqueHex(innerColor)
    if (!hex) return ''
    const index = brandColors.findIndex((colour) => opaqueHex(String(colour)) === hex)
    return index < 0 ? '' : `brand colour ${index + 1}`
  }, [innerColor, brandColors])

  function handleValueChange(next: string) {
    setInnerColor(next)
    onValueChange?.(next)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) setShowMoveable(false)
    else setShowMoveable(true)
    onOpenChange?.(next)
  }

  const picker = (
    <ColorPicker value={innerColor} modes={modes} history={history} presets={presets} onHistoryChange={setHistory} onValueChange={handleValueChange} onChange={onChange} />
  )

  if (variant === 'row') {
    return (
      <div className={cx('color__select', 'is-row', { 'is-off': !!onEnabledChange && !enabled }, className || '')}>
        <div className="color__row">
          {onEnabledChange ? <Checkbox className="color__check" value={!!enabled} onChange={onEnabledChange} /> : null}
          <Popover placement="left-end" width="auto" open={open} onOpenChange={handleOpenChange} keepOpenOnFocusOutside={keepOpenOnFocusOutside} content={picker}>
            <div className="color__field" role="button" aria-label={label || 'Colour'}>
              <span className="color__chip transparent-bg">
                <span className="color__chip-fill" style={{ background: innerColor }} />
              </span>
              <span className="color__label">{label}</span>
              <span className="color__pencil">
                <PencilIcon />
              </span>
            </div>
          </Popover>
        </div>
        <p className="color__value">
          {readableColor}
          {brandName ? <em> · {brandName}</em> : null}
        </p>
      </div>
    )
  }

  return (
    <div className={cx('color__select', className || '')} style={{ width }}>
      {label ? <p className="input-label">{label}</p> : null}
      <div className="content">
        <Popover placement="left-end" width="auto" open={open} onOpenChange={handleOpenChange} keepOpenOnFocusOutside={keepOpenOnFocusOutside} content={picker}>
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
