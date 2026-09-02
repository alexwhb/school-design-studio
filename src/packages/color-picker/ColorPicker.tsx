import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { debounce } from 'throttle-debounce'
import { registerMoveableElement } from './utils/moveable'
import { HSLA2HexA, RGB2HSL, RGBA2HexA, hex2RGB, hexA2HSLA, hexA2RGBA } from './utils/color'
import { parseBackgroundValue, toolTip } from './utils/helper'
import { type GradientType, parseGradient, toGradientString } from './utils/gradient'
import Segmented from '@/components/ui/Segmented'
import Straw from './comps/Straw'
import AngleHandle from './comps/AngleHandle'
import { cx } from '@/utils/dom'
import './colorPicker.less'

export type ColorChangeData = {
  mode: string
  color: string
  /** Which way a linear gradient runs. A radial one ignores it. */
  angle: number
  gradientType: GradientType
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
  /**
   * Named rows of colours offered above the recent ones — the school's brand
   * colours, so they are one click away from every swatch in the editor.
   */
  presets?: { label: string; colors: string[] }[]
}

const hasEyeDrop = typeof window !== 'undefined' && 'EyeDropper' in window

/** The two Adobe XD offers a fill, in the order it lists them. */
const GRADIENT_TYPES: GradientType[] = ['linear', 'radial']

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
  presets,
}: Props) {
  const [mode, setMode] = useState(() => parseBackgroundValue(value))
  const [angle, setAngle] = useState(90)
  const [gradientType, setGradientType] = useState<GradientType>('linear')
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
  const gradientTypeRef = useRef(gradientType)
  gradientTypeRef.current = gradientType
  const gradientsRef = useRef(gradients)
  gradientsRef.current = gradients
  const activeGradientRef = useRef(activeGradient)
  activeGradientRef.current = activeGradient
  const mousedownGradientPointer = useRef(false)
  const canChangeHSLAPointerPos = useRef(true)
  const canChangeHSLAPointerPosTimer = useRef<any>(null)
  const record = useRef({ color: defaultColor, gradient: defaultGradient, image: defaultImage })

  const showGradient = modes.includes('Gradient')

  /**
   * The stops drawn as a swatch. The track under them always reads left to
   * right, whatever the fill itself does, because that is what dragging a stop
   * along it moves — and a radial fill painted into a 16px strip is a blur.
   */
  const ramp = (type: GradientType) => (gradients.length ? toGradientString(type, 90, gradients) : value)
  const rampBackground = ramp('linear')

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
        gradientType: gradientTypeRef.current,
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
      next = toGradientString(gradientTypeRef.current, angleRef.current, gradientsRef.current)
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
        return
      }
      if (nextMode !== 'Gradient') return

      // The value is the only record of which gradient this is and which way it
      // runs, so it is read every time rather than once: the fill can change
      // under the picker, and switching back from Solid has to land on the
      // gradient the swatch was showing, not on the last one edited.
      const parsed = parseGradient(valueRef.current)
      if (parsed) {
        if (parsed.type !== gradientTypeRef.current) {
          gradientTypeRef.current = parsed.type
          setGradientType(parsed.type)
        }
        if (parsed.type === 'linear' && parsed.angle !== angleRef.current) {
          angleRef.current = parsed.angle
          setAngle(parsed.angle)
        }
      }

      if (gradientsRef.current.length === 0) {
        const stops = parsed?.stops ?? []
        gradientsRef.current = stops
        setGradients(stops)
        if (stops[0]) {
          activeGradientRef.current = stops[0]
          setActiveGradient(stops[0])
          setColor(stops[0].color)
        }
      } else if (activeGradientRef.current) {
        setColor(activeGradientRef.current.color)
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
      updateValue(toGradientString(gradientTypeRef.current, angleRef.current, next))
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
    updateValue(toGradientString(gradientTypeRef.current, nextAngle, gradientsRef.current))
  }

  function changeGradientType(next: GradientType) {
    if (next === gradientTypeRef.current) return
    gradientTypeRef.current = next
    setGradientType(next)
    updateValue(toGradientString(next, angleRef.current, gradientsRef.current))
  }

  return (
    <div className="color-picker">
      {modes.length > 1 ? <Segmented aria-label="Colour type" value={mode} options={modes} onChange={onChangeMode} /> : <div className="title">{mode}</div>}

      {showGradient ? (
        <div className="cp__gradient" style={{ display: mode === 'Gradient' ? undefined : 'none' }}>
          <div className="cp__gradient-head">
            <div className="cp__gradient-type">
              {GRADIENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  title={type === 'radial' ? 'Radial gradient' : 'Linear gradient'}
                  aria-label={type === 'radial' ? 'Radial gradient' : 'Linear gradient'}
                  aria-pressed={type === gradientType}
                  className={cx('cpgt__option', { 'cpgt__option--active': type === gradientType })}
                  onClick={() => changeGradientType(type)}
                >
                  <span className={`cpgt__swatch cpgt__swatch--${type}`} style={{ background: ramp(type) }} />
                </button>
              ))}
            </div>
            {gradientType === 'linear' ? <AngleHandle value={angle} onChange={angleChange} /> : null}
          </div>
          <div className="cp__gradient-bar">
            <div ref={elGradientTrack} className="cpgb__track" style={{ width: '100%', background: rampBackground }}>
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

      {presets?.map((group) =>
        group.colors.length ? (
          <div key={group.label} className="cp__presets">
            <span className="cp__presets-label">{group.label}</span>
            {group.colors.map((pc) => (
              <div key={pc} className="item item-color" style={{ background: pc }} title={pc} onClick={() => onClickStraw(pc)} />
            ))}
          </div>
        ) : null,
      )}

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
