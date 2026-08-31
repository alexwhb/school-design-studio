import { useRef, useState } from 'react'
import { cx } from '@/utils/dom'
import './textInputArea.less'

type Props = {
  label?: string
  value?: string
  editable?: boolean
  max?: string | number
  onChange?: (value: string) => void
  onFinish?: (value: string) => void
}

export default function TextInputArea({ label = '', value = '', editable = true, max, onChange, onFinish }: Props) {
  const [inputBorder, setInputBorder] = useState(false)
  const tagText = useRef('')

  return (
    <div id="text-input-area">
      {label ? <p className="input-label">{label}</p> : null}
      <div className={cx('input-wrap', { active: inputBorder })}>
        <textarea
          maxLength={max ? Number(max) : undefined}
          className={cx('real-input', { disable: !editable })}
          rows={3}
          value={value}
          readOnly={!editable}
          onChange={(e) => onChange?.(e.target.value)}
          onFocus={() => {
            setInputBorder(true)
            tagText.current = value
          }}
          onBlur={() => {
            setInputBorder(false)
            if (value !== tagText.current) onFinish?.(value)
          }}
        />
      </div>
    </div>
  )
}
