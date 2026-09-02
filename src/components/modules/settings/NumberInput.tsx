import { useEffect, useRef, useState } from 'react'
import { cx } from '@/utils/dom'
import './numberInput.less'

type Props = {
  label?: string
  value?: string | number
  editable?: boolean
  step?: number
  maxValue?: string | number
  minValue?: string | number
  type?: string
  prepend?: string
  onChange: (value: number | string) => void
  onFinish?: (value: number | string) => void
}

export default function NumberInput({ label = '', value = '', editable = true, step = 1, maxValue, minValue, type, prepend, onChange, onFinish }: Props) {
  const [inputBorder, setInputBorder] = useState(false)
  const tagText = useRef<string | number>('')
  const valueRef = useRef(value)
  valueRef.current = value

  useEffect(() => {
    fixedNum()
  }, [value])

  function fixedNum() {
    const decimal = String(value).split('.')[1]
    if (decimal && decimal.length > 2) {
      setTimeout(() => {
        updateValue(Number(value).toFixed(2))
      }, 10)
    }
    if (maxValue && value > maxValue) {
      setTimeout(() => {
        updateValue(Number(maxValue))
      }, 10)
    } else if (typeof minValue === 'number' && Number(value) < Number(minValue)) {
      setTimeout(() => {
        updateValue(Number(minValue))
      }, 10)
    }
  }

  function updateValue(next: string | number) {
    onChange(next === '-' ? '-' : Number(next))
  }

  function up() {
    updateValue(parseInt(`${valueRef.current}` ?? '0', 10) + step)
  }

  function down() {
    updateValue(parseInt(`${valueRef.current}` ?? '0', 10) - step)
  }

  function opNumber(e: React.KeyboardEvent) {
    e.stopPropagation()
    switch (e.keyCode) {
      case 38:
        up()
        return
      case 40:
        down()
        return
    }
  }

  function verifyNumber() {
    const raw = String(valueRef.current)
    const len = raw.length
    let newValue = ''
    const isNegative = raw[0] === '-'
    for (let i = isNegative ? 1 : 0; i < len; ++i) {
      const c = raw[i]
      if (c == '.' || (c >= '0' && c <= '9')) {
        newValue += c
      } else {
        break
      }
    }
    if (newValue === '') {
      newValue = '0'
    }
    if (isNegative) {
      newValue = '-' + (newValue === '0' ? '' : newValue)
    }
    updateValue(newValue)
  }

  function focusInput() {
    setInputBorder(true)
    tagText.current = value
  }

  function blurInput() {
    if (value === '-') {
      updateValue(0)
    }
    setInputBorder(false)
    if (value !== tagText.current) {
      onFinish?.(value)
    }
  }

  if (type === 'simple') {
    return (
      <div>
        <span className="prepend">{prepend}</span>
        <input className={cx('small-input', { disable: !editable })} type="text" value={value} readOnly={!editable} onChange={(e) => updateValue(e.target.value)} onFocus={focusInput} onBlur={blurInput} onKeyUp={verifyNumber} onKeyDown={opNumber} />
      </div>
    )
  }

  return (
    <div className="number-input2">
      <div className="input-wrap">
        <input className={cx('real-input', { disable: !editable })} type="text" value={value} readOnly={!editable} onChange={(e) => updateValue(e.target.value)} onFocus={focusInput} onBlur={blurInput} onKeyUp={verifyNumber} onKeyDown={opNumber} />
      </div>
      <span className="input-axis">{label}</span>
    </div>
  )
}
