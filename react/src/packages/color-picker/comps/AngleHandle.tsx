import { useEffect, useRef, useState } from 'react'
import './angleHandle.less'

type Props = {
  value: number
  onChange: (value: number) => void
  onCommit?: () => void
}

export default function AngleHandle({ value, onChange, onCommit }: Props) {
  const [num, setNum] = useState(value)
  const [visible, setVisible] = useState(false)
  const inProcess = useRef(false)

  useEffect(() => {
    setNum(value)
  }, [value])

  const angleInDegrees = num - 90

  const update = (next: number) => {
    setNum(next)
    if (value !== next) onChange(next)
    onCommit?.()
  }

  const turn = (e: React.MouseEvent) => {
    if (!inProcess.current) {
      return
    }
    const origin = { x: 27, y: 27 }
    const deltaX = e.nativeEvent.offsetX - origin.x
    const deltaY = e.nativeEvent.offsetY - origin.y
    const angleInRadians = Math.atan2(deltaY, deltaX)
    const degrees = (angleInRadians * 180) / Math.PI
    update(Math.round(degrees + 90))
  }

  const touch = (e: React.MouseEvent, isHandle: boolean) => {
    e.preventDefault()
    inProcess.current = isHandle
  }

  return (
    <div className="angle-input-box">
      <input
        className="angle-input"
        value={num}
        onFocus={() => setVisible(true)}
        onBlur={() => setVisible(false)}
        onChange={(e) => update(Number(e.target.value) || 0)}
      />
      <div
        className="AngleHandle"
        style={{ display: visible ? undefined : 'none' }}
        onMouseDown={(e) => touch(e, true)}
        onMouseUp={(e) => touch(e, false)}
      >
        <div className="angle" onMouseUp={turn} onMouseMove={turn}>
          <div style={{ transform: `rotate(${angleInDegrees}deg)` }} className="line" />
        </div>
      </div>
    </div>
  )
}
