import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { debounce } from 'throttle-debounce'
import { registerMoveableElement } from './utils/moveable'
import { HSLA2HexA, RGB2HSL, RGBA2HexA, hex2RGB, hexA2HSLA, hexA2RGBA } from './utils/color'
import { parseBackgroundValue, toGradientString, toolTip } from './utils/helper'
import Tabs from './comps/Tabs'
import Straw from './comps/Straw'
import AngleHandle from './comps/AngleHandle'
import { cx } from '@/utils/dom'
import './colorPicker.less'

export type ColorChangeData = {
  mode: string
  color: string
  angle: number
  stops: { color: string; offset: number }[]
}

type Gradient = { color: string; offset: number }

type Props = {
  value?: string
  modes?: string[]
  defaultColor?: string
  defaultGradient?: string
  defaultImage?: string
  onValueChange?: (value: string) => void
  onChange?: (data: ColorChangeData) => void
  onNativePick?: (value: string) => void
  onBlurColor?: (value: string) => void
  /**
   * Recently used colours, and where to keep them.
   *
   * Element Plus leaves a popover's contents mounted once opened, so the Vue
   * picker's history outlives the popover; Radix unmounts them, which would
   * reset the row every time it is opened. The owner holds the list instead.
   */
  history?: string[]
  onHistoryChange?: (history: string[]) => void
}

const hasEyeDrop = typeof window !== 'undefined' && 'EyeDropper' in window

export default function ColorPicker({
  value = '#ffffffff',
  modes = ['Solid', 'Gradient'],
  defaultColor = '#ffffffff',
  defaultGradient = 'linear-gradient(90deg, #fffae0ff 0%, #ffd1f1ff 100%)',
  defaultImage = 'https://st0.dancf.com/csc/157/material-2d-textures/0/20190714-174653-ed3c.jpg',
  onValueChange,
  onChange,
  onNativePick,
  onBlurColor,
  history,
  onHistoryChange,
}: Props) {
  const [mode, setMode] = useState(() => parseBackgroundValue(value))
  const [angle, setAngle] = useState(90)
  const [gradients, setGradients] = useState<Gradient[]>([])
  const [paletteBackground, setPaletteBackground] = useState('#f00')
  const [hex, setHex] = useState('#000')
  const [hexDraft, setHexDraft] = useState(value)
  const [ownPredefine, setOwnPredefine] = useState<string[]>([])
  const predefine = history ?? ownPredefine
  const [activeGradient, setActiveGradient] = useState<Gradient | null>(null)

  const hsla = useRef({ h: 0, s: 0, l: 0, a: 0 })
  const elGradientTrack = useRef<HTMLDivElement | null>(null)
  const elPalette = useRef<HTMLDivElement | null>(null)
  const elPalettePointer = useRef<HTMLDivElement | null>(null)
  const elSliderHux = useRef<HTMLDivElement | null>(null)
  const elSliderHuxPointer = useRef<HTMLDivElement | null>(null)
  const elSliderAlpha = useRef<HTMLDivElement | null>(null)
  const elSliderAlphaPointer = useRef<HTMLDivElement | null>(null)

  const modeRef = useRef(mode)
  modeRef.current = mode
  const valueRef = useRef(value)
  valueRef.current = value
  const angleRef = useRef(angle)
  angleRef.current = angle
  const gradientsRef = useRef(gradients)
  gradientsRef.current = gradients
  const activeGradientRef = useRef(activeGradient)
  activeGradientRef.current = activeGradient
  const mousedownGradientPointer = useRef(false)
  const canChangeHSLAPointerPos = useRef(true)
  const canChangeHSLAPointerPosTimer = useRef<any>(null)
  const record = useRef({ color: defaultColor, gradient: defaultGradient, image: defaultImage })

  const showGradient = modes.includes('Gradient')

  const sliderAlphaBackgroundStyle = (() => {
    const rgb = hex2RGB(hex).join(',')
    return { background: `linear-gradient(to right, rgba(${rgb}, 0) 0%, rgb(${rgb}) 100%)` }
  })()

  const recordValue = useCallback((next: string) => {
    if (modeRef.current === 'Solid') {
      record.current.color = next
    } else if (modeRef.current === 'Gradient') {
      record.current.gradient = next
    } else if (modeRef.current === 'Pattern') {
      record.current.image = next
    }
  }, [])

  const updateValue = useCallback(
    (next: string) => {
      if (next === valueRef.current) return
      recordValue(next)
      valueRef.current = next
      onValueChange?.(next)
      onChange?.({
        mode: modeRef.current,
        color: next,
        angle: Number(angleRef.current),
        stops: gradientsRef.current,
      })
    },
    [onValueChange, onChange, recordValue],
  )

  const updateColorData = useCallback((hexA: string) => {
    setPaletteBackground(`hsl(${hsla.current.h}, 100%, 50%)`)
    setHex(hexA.slice(0, 7))
  }, [])

  const applyPointers = useCallback(() => {
    if (elPalettePointer.current) {
      elPalettePointer.current.style.left = `${hsla.current.s}%`
      elPalettePointer.current.style.top = `${100 - hsla.current.l}%`
    }
    if (elSliderHuxPointer.current) {
      elSliderHuxPointer.current.style.left = `${(hsla.current.h / 360) * 100}%`
    }
    if (elSliderAlphaPointer.current) {
      elSliderAlphaPointer.current.style.left = `${hsla.current.a * 100}%`
    }
  }, [])

  const setColor = useCallback(
    (color: string) => {
      if (!canChangeHSLAPointerPos.current) return
      const next = hexA2HSLA(color)
      hsla.current = { h: next[0], s: next[1], l: next[2], a: next[3] }
      updateColorData(color)
      applyPointers()
    },
    [applyPointers, updateColorData],
  )

  const onChangeHSLA = useCallback(() => {
    const hexA = HSLA2HexA(hsla.current.h, hsla.current.s, hsla.current.l, hsla.current.a)
    let next: string | undefined
    if (modeRef.current === 'Solid') {
      next = hexA
    } else if (modeRef.current === 'Gradient' && activeGradientRef.current) {
      activeGradientRef.current.color = hexA
      next = toGradientString(angleRef.current, gradientsRef.current)
      setGradients((prev) => prev.slice())
    }
    updateColorData(hexA)
    next !== undefined && updateValue(next)
  }, [updateColorData, updateValue])

  const disableChangeHSLA = useCallback(() => {
    canChangeHSLAPointerPos.current = false
    if (canChangeHSLAPointerPosTimer.current) clearTimeout(canChangeHSLAPointerPosTimer.current)
    canChangeHSLAPointerPosTimer.current = setTimeout(() => {
      canChangeHSLAPointerPos.current = true
    }, 16)
  }, [])

  const changeMode = useCallback(
    (nextMode: string) => {
      if (nextMode === 'Solid') {
        setColor(valueRef.current)
      } else if (nextMode === 'Gradient') {
        if (gradientsRef.current.length === 0) {
          const parsed: Gradient[] = []
          const parts = valueRef.current.match(/[^,]+/g) || []
          parts.forEach((item, index) => {
            if (index === 0) {
              const found = item.match(/\d+/)
              found && setAngle(Number(found[0]))
              found && (angleRef.current = Number(found[0]))
              return
            }
            let [color, offset] = item.trim().split(' ')
            if (!color.startsWith('#')) {
              const [r, g, b, a = 1] = (color.match(/[\d.]+/g) || []).map(Number)
              color = RGBA2HexA(r, g, b, a)
            }
            const offsetValue = Number(offset.match(/\d+/)?.[0] ?? 0) / 100
            parsed.push({ color, offset: offsetValue })
          })
          gradientsRef.current = parsed
          setGradients(parsed)
          if (parsed[0]) {
            activeGradientRef.current = parsed[0]
            setActiveGradient(parsed[0])
            setColor(parsed[0].color)
          }
        } else if (activeGradientRef.current) {
          setColor(activeGradientRef.current.color)
        }
      }
    },
    [setColor],
  )

  const historyRef = useRef(predefine)
  historyRef.current = predefine
  const onHistoryChangeRef = useRef(onHistoryChange)
  onHistoryChangeRef.current = onHistoryChange

  const addHistory = useRef(
    debounce(300, (next: string) => {
      const previous = historyRef.current
      const list = previous.slice()
      const index = list.indexOf(next)
      if (index !== -1) list.splice(index, 1)
      if (list.length >= 4) list.splice(list.length - 1, 1)
      const updated = [next].concat(list)
      if (onHistoryChangeRef.current) onHistoryChangeRef.current(updated)
      else setOwnPredefine(updated)
    }),
  )

  useLayoutEffect(() => {
    applyPointers()
  }, [applyPointers])

  useEffect(() => {
    const nextMode = parseBackgroundValue(value)
    if (nextMode !== modeRef.current) {
      modeRef.current = nextMode
      setMode(nextMode)
    }
    changeMode(nextMode)
    recordValue(value)
    addHistory.current(value)
    setHexDraft(value)
  }, [value, changeMode, recordValue])

  useEffect(() => {
    const paletteMoveable = elPalette.current
      ? registerMoveableElement(elPalette.current, {
          onmousemove: onChangeSL,
          onmouseup: onChangeSL,
        })
      : null

    function onChangeSL(position: { x: number; y: number }) {
      disableChangeHSLA()
      const x = position.x * 100
      const y = position.y * 100
      hsla.current.s = Math.round(x)
      hsla.current.l = Math.round(100 - y)
      if (elPalettePointer.current) {
        elPalettePointer.current.style.left = `${x}%`
        elPalettePointer.current.style.top = `${y}%`
      }
      onChangeHSLA()
    }

    const sliderHuxMoveable = elSliderHux.current
      ? registerMoveableElement(elSliderHux.current, { onmousemove: onChangeHux, onmouseup: onChangeHux })
      : null

    function onChangeHux(position: { x: number; y: number }) {
      disableChangeHSLA()
      hsla.current.h = position.x * 360
      if (elSliderHuxPointer.current) elSliderHuxPointer.current.style.left = `${position.x * 100}%`
      onChangeHSLA()
    }

    const sliderAlphaMoveable = elSliderAlpha.current
      ? registerMoveableElement(elSliderAlpha.current, { onmousemove: onChangeAlphaPos, onmouseup: onChangeAlphaPos })
      : null

    function onChangeAlphaPos(position: { x: number; y: number }) {
      disableChangeHSLA()
      hsla.current.a = position.x
      if (elSliderAlphaPointer.current) elSliderAlphaPointer.current.style.left = `${position.x * 100}%`
      onChangeHSLA()
    }

    let gradientMoveable: { destroy: () => void } | null = null
    if (showGradient && elGradientTrack.current) {
      gradientMoveable = registerMoveableElement(elGradientTrack.current, {
        onmousedown: onMousedownGradient,
        onmousemove: onMousemoveGradient,
        onmouseup: onMouseupGradient,
      })
    }

    function onMousedownGradient(position: { x: number; y: number }) {
      if (mousedownGradientPointer.current) {
        return
      }
      const list = gradientsRef.current
      const index = list.findIndex((stop) => stop.offset >= position.x)
      const start = list[index - 1]
      const end = list[index]
      if (!start || !end) return
      const startRGBA = hexA2RGBA(start.color)
      const endRGBA = hexA2RGBA(end.color)

      const rgb: number[] = []
      for (let i = 0; i < 3; i += 1) {
        rgb.push(startRGBA[i] + (endRGBA[i] - startRGBA[i]) * position.x)
      }

      const a = end.offset - position.x - (position.x - start.offset) > 0 ? startRGBA[3] : endRGBA[3]
      const color = RGBA2HexA(rgb[0], rgb[1], rgb[2], a)
      const created = { color, offset: position.x }
      const next = list.slice()
      next.splice(index, 0, created)
      gradientsRef.current = next
      setGradients(next)
      activeGradientRef.current = created
      setActiveGradient(created)
      setColor(created.color)
    }

    function onMousemoveGradient(position: { x: number; y: number }) {
      if (!mousedownGradientPointer.current) return
      const active = activeGradientRef.current
      if (!active) return
      active.offset = position.x
      const next = gradientsRef.current.slice().sort((a, b) => a.offset - b.offset)
      gradientsRef.current = next
      setGradients(next)
      updateValue(toGradientString(angleRef.current, next))
    }

    function onMouseupGradient() {
      mousedownGradientPointer.current = false
    }

    changeMode(modeRef.current)
    recordValue(valueRef.current)

    return () => {
      paletteMoveable?.destroy()
      sliderHuxMoveable?.destroy()
      sliderAlphaMoveable?.destroy()
      gradientMoveable?.destroy()
    }
  }, [showGradient, disableChangeHSLA, onChangeHSLA, changeMode, recordValue, setColor, updateValue])

  function onChangeMode(nextMode: string) {
    if (nextMode === modeRef.current) return
    modeRef.current = nextMode
    setMode(nextMode)
    let color: string | undefined
    if (nextMode === 'Solid') {
      color = record.current.color
    } else if (nextMode === 'Gradient') {
      color = record.current.gradient
    } else if (nextMode === 'Pattern') {
      color = record.current.image
    }
    color !== undefined && updateValue(color)
  }

  async function onClickStraw(nextValue?: string) {
    let result = ''
    if (nextValue) {
      result = nextValue + (nextValue.length === 7 ? 'ff' : '')
    } else {
      const eyeDropper = new (window as any).EyeDropper()
      toolTip('Press Esc to cancel')
      try {
        const drop = await eyeDropper.open()
        result = drop.sRGBHex + 'ff'
      } catch (e) {
        return
      }
    }
    if (modeRef.current === 'Gradient' && activeGradientRef.current) {
      activeGradientRef.current.color = result
      const next = gradientsRef.current.slice()
      gradientsRef.current = next
      setGradients(next)
      setActiveGradient({ ...activeGradientRef.current })
      setColor(result)
    } else {
      onValueChange?.(result)
    }
    onNativePick?.(result)
  }

  function patchHexColor(str: string) {
    let next = str.replace(/\s/g, '')
    if (!str.startsWith('#')) {
      next = '#' + next
    }
    if (next.length < 9) {
      next = next.padEnd(9, 'f')
    }
    return next
  }

  function onInputBlur(e: React.FocusEvent<HTMLInputElement>) {
    const fixColor = patchHexColor(e.target.value)
    onBlurColor?.(fixColor)
    onValueChange?.(fixColor)
  }

  function onMousedownGradientPointer(stop: Gradient) {
    mousedownGradientPointer.current = true
    activeGradientRef.current = stop
    setActiveGradient(stop)
    setColor(stop.color)
  }

  function onKeyupGradientPointer(event: React.KeyboardEvent) {
    event.stopPropagation()
    event.preventDefault()
    if (!['Backspace', 'Delete'].includes(event.key)) return
    if (gradientsRef.current.length === 2) return
    const index = gradientsRef.current.indexOf(activeGradientRef.current as Gradient)
    const next = gradientsRef.current.slice()
    next.splice(index, 1)
    gradientsRef.current = next
    setGradients(next)
    activeGradientRef.current = next[0]
    setActiveGradient(next[0])
  }

  function angleChange(nextAngle: number) {
    angleRef.current = nextAngle
    setAngle(nextAngle)
    updateValue(toGradientString(nextAngle, gradientsRef.current))
  }

  return (
    <div className="color-picker">
      {modes.length > 1 ? <Tabs value={mode} labels={modes} onChange={onChangeMode} /> : <div className="title">{mode}</div>}

      {showGradient ? (
        <div className="cp__gradient flex-center" style={{ display: mode === 'Gradient' ? undefined : 'none' }}>
          <div className="cp__gradient-bar">
            <div ref={elGradientTrack} className="cpgb__track" style={{ width: '100%', background: value }}>
              {gradients.map((gradient, index) => (
                <div
                  key={index}
                  className={cx('cpgb__pointer', { 'cpgb__pointer--active': gradient === activeGradient })}
                  data-sort={index}
                  style={{ left: `${gradient.offset * 100}%`, background: gradient.color }}
                  tabIndex={-1}
                  onMouseDown={() => onMousedownGradientPointer(gradient)}
                  onKeyDown={onKeyupGradientPointer}
                />
              ))}
            </div>
          </div>
          <AngleHandle value={angle} onChange={angleChange} />
        </div>
      ) : null}

      <div ref={elPalette} className="cp__palette" style={{ background: paletteBackground }}>
        <div className="cpp__color-saturation" />
        <div className="cpp__color-value" />
        <div ref={elPalettePointer} className="cpp__pointer" />
      </div>

      <div ref={elSliderHux} className="cp__slider cp__slider-hux">
        <div className="cps__track">
          <div ref={elSliderHuxPointer} className="cpst__pointer" />
        </div>
      </div>

      <div ref={elSliderAlpha} className="cp__slider cp__slider-alpha">
        <div className="cpsa__background" style={sliderAlphaBackgroundStyle} />
        <div className="cps__track">
          <div ref={elSliderAlphaPointer} className="cpst__pointer" />
        </div>
      </div>

      <div className="cp__box">
        <div className="item" onClick={() => hasEyeDrop && onClickStraw()}>
          {hasEyeDrop ? <Straw /> : <input className="native" type="color" onInput={(e) => onClickStraw((e.target as HTMLInputElement).value)} />}
        </div>
        {mode === 'Gradient' ? (
          <input className="input" value={activeGradient?.color ?? ''} readOnly />
        ) : (
          // A draft, committed on blur, because that is what the original does —
          // and because binding it straight to `value` makes the field
          // unwritable: every keystroke is a partial colour, which the picker
          // does not accept, so React puts the old text straight back.
          <input
            value={hexDraft}
            className="input"
            onChange={(e) => setHexDraft(e.target.value)}
            onBlur={(e) => {
              setHexDraft(value)
              onInputBlur(e)
            }}
          />
        )}
        {mode === 'Solid'
          ? predefine.map((pc) => (
              <div key={pc} className="item item-color" style={{ background: pc }} onClick={() => onClickStraw(pc)} />
            ))
          : null}
      </div>
    </div>
  )
}
