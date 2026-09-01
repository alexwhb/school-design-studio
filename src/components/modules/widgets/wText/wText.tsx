import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { setUpdateRect } from '@/store/force'
import { widgetState } from '@/store/state'
import { updateWidgetData, updateWidgetMultiple } from '@/store/widget/widget'
import { fontMinWithDraw } from '@/utils/widgets/loadFontRule'
import { cx } from '@/utils/dom'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import useSpellcheck from '@/common/hooks/useSpellcheck'
import CurvedText from './CurvedText'
import layoutCurvedText, { forgetMeasurements } from './arcLayout'
import useFontTick from './useFontTick'
import effectStyle from './effectStyle'
import type { WidgetProps } from '../types'
import './wText.less'

function WText({ params, parent, id, className, child, ...rest }: WidgetProps) {
  const p = useSnapshot(params) as any
  const mode = useEditorMode()
  const isDraw = mode === 'draw'
  /** Editor-wide preference; see common/hooks/useSpellcheck.ts. */
  const { enabled: spellcheck } = useSpellcheck()

  const [loading, setLoading] = useState(false)
  const [editable, setEditable] = useState(false)
  const fontTick = useFontTick(p.fontClass.value)
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const editWrapRef = useRef<HTMLDivElement | null>(null)
  const loadFontDone = useRef('')

  const fontFamily = `'${p.fontClass.value}'`

  /**
   * The arc, when there is one. Editing drops it, the way the text effects are
   * dropped: a curved run is a character per element, and there is nothing
   * there to put a cursor in. It comes back on the way out of the caret.
   */
  const curved = useMemo(
    () =>
      editable
        ? null
        : layoutCurvedText({
            text: p.text,
            curve: p.curve,
            fontSize: p.fontSize,
            lineHeight: p.lineHeight,
            letterSpacing: p.letterSpacing,
            fontFamily,
            fontWeight: p.fontWeight,
            fontStyle: p.fontStyle,
          }),
    // Neither fontTick nor loading is read above; they are what re-measures the
    // arc once the typeface it is set in has actually arrived, since the widths
    // it is built from come out of the font.
    [editable, p.text, p.curve, p.fontSize, p.lineHeight, p.letterSpacing, fontFamily, p.fontWeight, p.fontStyle, fontTick, loading],
  )

  useLayoutEffect(() => {
    const el = editWrapRef.current
    if (el && el.innerHTML !== p.text) {
      el.innerHTML = p.text ?? ''
    }
  }, [p.text, editable])

  useEffect(() => {
    updateRecord()
  })

  // Rebuilt from the store whenever it changes rather than once on mount, or an
  // undone rotation stays on screen: Moveable writes the turn straight to the
  // element, so nothing else puts it back.
  useEffect(() => {
    const el = widgetRef.current
    if (!el) return
    let transform = p.transform || ''
    if (p.rotate) transform += `translate(0px, 0px) rotate(${p.rotate}) scale(1, 1)`
    el.style.transform = transform
  }, [p.transform, p.rotate])

  useEffect(() => {
    let cancelled = false
    const font = params.fontClass as any
    if (!font) return
    const isDone = font.value === loadFontDone.current
    if (font.url && !isDone) {
      if (fontMinWithDraw) return
      setLoading(!isDraw)
      const loadFont = new window.FontFace(font.value, `url(${font.url})`)
      loadFont
        .load()
        .then(() => {
          if (cancelled) return
          document.fonts.add(loadFont)
          // Adding a face that has already loaded is not the font set loading
          // anything, so nothing else will say that the measurements taken in
          // the fallback are out of date.
          forgetMeasurements()
          loadFontDone.current = font.value
          setLoading(false)
        })
        .catch(() => {
          if (!cancelled) setLoading(false)
        })
    } else {
      setLoading(false)
    }
    return () => {
      cancelled = true
    }
  }, [params, p.fontClass.value, p.fontClass.url, isDraw])

  /**
   * Fits the widget's box to the arc.
   *
   * Straight text is laid out by the browser and measured back off the element,
   * which is what `writingText` does. A curved run is placed by us, so nothing
   * on the page knows how big it came out and the box has to be told.
   */
  useEffect(() => {
    if (!curved) return
    const width = Math.round(curved.width)
    const height = Math.round(curved.height)
    const wasWidth = Math.round(Number(params.width) || 0)
    if (wasWidth === width && Math.round(Number(params.height) || 0) === height) return
    updateWidgetMultiple({
      uuid: String(params.uuid),
      data: [
        // Deepening the curve draws the ends of the line in, so the box loses
        // width. Give half of that back to the left edge and the text bends
        // where it stands, rather than creeping across the page as it goes.
        { key: 'left', value: Math.round(Number(params.left) + (wasWidth ? (wasWidth - width) / 2 : 0)) },
        { key: 'width', value: width },
        { key: 'height', value: height },
      ],
    })
    // Next frame, not this one: the selection box is measured off the element,
    // and the element is still the size it was until the new box has rendered.
    requestAnimationFrame(() => setUpdateRect())
  }, [curved, params])

  const lastEditable = useRef(editable)
  useEffect(() => {
    if (lastEditable.current === editable) return
    lastEditable.current = editable
    updateWidgetData({ uuid: String(params.uuid), key: 'editable', value: editable })
  }, [editable, params.uuid])

  function updateRecord() {
    const el = widgetRef.current
    if (!el) return
    const active = widgetState.dActiveElement
    if (active && active.uuid === String(params.uuid)) {
      const record = active.record
      if (!record) return
      record.width = el.offsetWidth
      record.height = el.offsetHeight
      record.minWidth = params.fontSize as number
      record.minHeight = (params.fontSize as number) * (params as any).lineHeight
      writingText()
    }
  }

  function updateText(e?: { target: HTMLElement }) {
    const value = e && e.target ? e.target.innerHTML : params.text
    if (value !== params.text) {
      updateWidgetData({ uuid: String(params.uuid), key: 'text', value: value as string })
    }
  }

  function writingText() {
    // A curved run's box comes from the arc, not from what the browser laid
    // out — see the effect that fits it.
    if (curved) return
    const el = editWrapRef.current || widgetRef.current
    if (!el) return
    updateWidgetData({ uuid: String(params.uuid), key: 'height', value: el.offsetHeight })
    setUpdateRect()
  }

  function writeDone(e: React.FocusEvent<HTMLDivElement>) {
    setEditable(false)
    updateText({ target: e.target })
  }

  function dblclickText() {
    if (editable) return
    setEditable(true)
    setTimeout(() => {
      // Read after the re-render, not before it: a curved run has no editable
      // element until the caret goes in, and this is what puts it there.
      const el = editWrapRef.current || widgetRef.current
      if (!el) return
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
    }, 100)
  }

  return (
    <div
      {...rest}
      id={id ?? `${params.uuid}`}
      ref={widgetRef}
      className={cx('w-text', { editing: editable, 'layer-lock': !!p.lock }, String(params.uuid), className || '')}
      style={{
        position: 'absolute',
        left: p.left - parent.left + 'px',
        top: p.top - parent.top + 'px',
        width: p.width + 'px',
        minWidth: p.fontSize + 'px',
        minHeight: p.fontSize * p.lineHeight + 'px',
        height: p.height + 'px',
        lineHeight: p.fontSize * p.lineHeight + 'px',
        letterSpacing: (p.fontSize * p.letterSpacing) / 100 + 'px',
        fontSize: p.fontSize + 'px',
        color: p.color,
        textAlign: p.textAlign,
        textAlignLast: p.textAlignLast,
        fontWeight: p.fontWeight,
        fontStyle: p.fontStyle,
        textDecoration: p.textDecoration,
        opacity: p.opacity,
        backgroundColor: p.backgroundColor,
        writingMode: p.writingMode,
        fontFamily,
      }}
      onDoubleClick={dblclickText}
    >
      {p.textEffects && !editable
        ? p.textEffects.map((ef: any, efi: number) =>
            curved ? (
              <CurvedText key={efi + 'effect'} layout={curved} className="effect-text" style={{ fontFamily, ...effectStyle(ef) }} />
            ) : (
              <div
                key={efi + 'effect'}
                style={{ fontFamily, ...effectStyle(ef) }}
                className="edit-text effect-text"
                spellCheck={false}
                dangerouslySetInnerHTML={{ __html: p.text ?? '' }}
              />
            ),
          )
        : null}
      {curved ? (
        <CurvedText layout={curved} style={{ fontFamily }} />
      ) : (
        <div
          ref={editWrapRef}
          style={{ fontFamily }}
          className="edit-text"
          spellCheck={spellcheck}
          contentEditable={editable ? 'plaintext-only' : false}
          suppressContentEditableWarning
          onInput={() => writingText()}
          onBlur={writeDone}
        />
      )}
      {loading ? <div className="w-text__loading" /> : null}
    </div>
  )
}

export default memo(WText)
