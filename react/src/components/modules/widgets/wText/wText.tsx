import { memo, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { setUpdateRect } from '@/store/force'
import { widgetState } from '@/store/state'
import { updateWidgetData } from '@/store/widget/widget'
import { fontMinWithDraw } from '@/utils/widgets/loadFontRule'
import { cx } from '@/utils/dom'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import useSpellcheck from '@/common/hooks/useSpellcheck'
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
  const widgetRef = useRef<HTMLDivElement | null>(null)
  const editWrapRef = useRef<HTMLDivElement | null>(null)
  const loadFontDone = useRef('')
  const mounted = useRef(false)

  const fontFamily = `'${p.fontClass.value}'`

  useLayoutEffect(() => {
    const el = editWrapRef.current
    if (el && el.innerHTML !== p.text) {
      el.innerHTML = p.text ?? ''
    }
  }, [p.text, editable])

  useEffect(() => {
    updateRecord()
  })

  useEffect(() => {
    const el = widgetRef.current
    if (!el || mounted.current) return
    mounted.current = true
    params.transform && (el.style.transform = params.transform)
    params.rotate && (el.style.transform += `translate(0px, 0px) rotate(${params.rotate}) scale(1, 1)`)
  }, [params])

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
    const el = editWrapRef.current || widgetRef.current
    setTimeout(() => {
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
        ? p.textEffects.map((ef: any, efi: number) => (
            <div
              key={efi + 'effect'}
              style={{ fontFamily, ...effectStyle(ef) }}
              className="edit-text effect-text"
              spellCheck={false}
              dangerouslySetInnerHTML={{ __html: p.text ?? '' }}
            />
          ))
        : null}
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
      {loading ? <div className="w-text__loading" /> : null}
    </div>
  )
}

export default memo(WText)
