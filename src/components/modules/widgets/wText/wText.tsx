import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import { setUpdateRect } from '@/store/force'
import { widgetState } from '@/store/state'
import { updateWidgetData, updateWidgetMultiple } from '@/store/widget/widget'
import { fontMinWithDraw } from '@/utils/widgets/loadFontRule'
import { cx } from '@/utils/dom'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import useSpellcheck from '@/common/hooks/useSpellcheck'
import { recordHistory } from '@/common/hooks/history'
import { escapeHitOverlay } from '@/mixins/overlayEscape'
import { htmlToLines, linesToHtml, sanitiseText } from '@/utils/widgets/richText'
import CurvedText from './CurvedText'
import layoutCurvedText, { forgetMeasurements } from './arcLayout'
import useFontTick from './useFontTick'
import effectStyle from './effectStyle'
import type { TListStyle } from './listMarkup'
import { blurStaysInSession, endInlineSession, startInlineSession, toggleInline, type TInlineKind } from './inlineFormat'
import InlineToolbar from './InlineToolbar'
import type { WidgetProps } from '../types'
import './wText.less'

/**
 * Marks a copy made inside one of this editor's text boxes, so a paste can tell
 * it from a copy made anywhere else. Anything else is pasted as plain text.
 */
const OWN_CLIPBOARD = '<!--ds-text-->'

const SHORTCUTS: Record<string, TInlineKind> = { b: 'bold', i: 'italic', u: 'underline' }

/** The whole-box property each selection style falls back to, and its off value. */
const BOX_STYLE: Record<TInlineKind, { key: string; off: string }> = {
  bold: { key: 'fontWeight', off: 'normal' },
  italic: { key: 'fontStyle', off: 'normal' },
  underline: { key: 'textDecoration', off: 'none' },
  strike: { key: 'textDecoration', off: 'none' },
}

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
  const listStyle = (p.listStyle ?? 'none') as TListStyle

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

  // The formatting session lives as long as the caret does — see inlineFormat.ts.
  useEffect(() => {
    const el = editWrapRef.current
    if (!editable || !el) return
    startInlineSession(String(params.uuid), el, finishEdit)
    return () => endInlineSession(el)
    // finishEdit is stable for the life of one edit: it reads its refs, not
    // its closure, and the session is torn down when the edit ends.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const written = e && e.target ? e.target.innerHTML : params.text
    // Every write goes through the allowlist. That pares a paste back to what
    // the box may hold, and puts back the markup Chromium's editing leaves in a
    // shape the model does not describe — a nested <ul> after Tab, a bare
    // <div> after Enter on an empty bullet — as one flat list.
    const value = sanitiseText(written as string, listStyle)
    if (value !== params.text) {
      updateWidgetData({ uuid: String(params.uuid), key: 'text', value })
    }
  }

  /**
   * A paste is plain text unless it was copied out of one of these boxes, in
   * which case the bold and the links come with it. Anything from a web page
   * or a document arrives with fonts, sizes and classes the box cannot hold;
   * rather than pick through them, only the words are kept. execCommand keeps
   * the caret and the field's own undo stack, which writing innerHTML would
   * throw away.
   */
  function paste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html')
    if (html && html.includes(OWN_CLIPBOARD)) {
      // Lines, not a list: pasted into the middle of an item, list markup
      // would nest, and the write normalises the lines into items anyway.
      document.execCommand('insertHTML', false, linesToHtml(htmlToLines(html)))
      return
    }
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
  }

  /** A copy carries the formatting, marked as this editor's own. */
  function copy(e: React.ClipboardEvent<HTMLDivElement>, cut = false) {
    const selection = document.getSelection()
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return
    const holder = document.createElement('div')
    holder.appendChild(selection.getRangeAt(0).cloneContents())
    e.preventDefault()
    e.clipboardData.setData('text/html', OWN_CLIPBOARD + sanitiseText(holder.innerHTML))
    e.clipboardData.setData('text/plain', selection.toString())
    if (cut) document.execCommand('delete', false)
  }

  /**
   * The keys the box takes for itself. The editor's own shortcuts leave a
   * contentEditable alone, so Escape has to end the edit from here — and
   * Ctrl+B, which the browser would apply on its own, goes through the session
   * so the panel sees it.
   */
  function keydown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      // A picker or the link field standing open over the box takes the
      // Escape for itself — it closes, the caret stays where it was, and a
      // second Escape ends the edit. Asked rather than looked for: both Radix
      // and Element Plus have the thing out of the DOM before this runs, which
      // is what overlayEscape is for.
      if (escapeHitOverlay()) return
      e.preventDefault()
      // Ending the edit is the whole step Escape takes here. Left to carry on,
      // it would reach the editor's own handler, find nothing being typed into
      // any more, and go on to drop the selection as well.
      e.stopPropagation()
      // No press brackets this the way clicking away is bracketed, so the
      // edit records its own undo step.
      recordHistory(finishEdit)
      return
    }
    const kind = (e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey ? SHORTCUTS[e.key.toLowerCase()] : undefined
    if (kind) {
      e.preventDefault()
      toggleInline(kind) || boxToggle(kind)
    }
  }

  /**
   * Takes a style the whole box carries back off it. Where a selection's Bold
   * falls to when the box is already bold all over — see inlineFormat.ts.
   */
  function boxToggle(kind: TInlineKind) {
    const { key, off } = BOX_STYLE[kind]
    recordHistory(() => updateWidgetData({ uuid: String(params.uuid), key: key as any, value: off }))
  }

  /** A link in the box is for the presenter; on the canvas a click is a click. */
  function onClick(e: React.MouseEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('a')) e.preventDefault()
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

  const editing = useRef(false)
  editing.current = editable

  /** Ends the edit and stores what was typed. Safe to call more than once. */
  function finishEdit() {
    const el = editWrapRef.current
    if (!editing.current || !el) return
    editing.current = false
    setEditable(false)
    el.blur()
    updateText({ target: el })
  }

  /**
   * Focus leaving the box ends the edit — unless it has gone to one of the
   * box's own formatting controls, in which case the edit stays open and the
   * session puts the selection back when the control is used. A press
   * anywhere else ends it then; see inlineFormat.ts.
   */
  function writeDone(e: React.FocusEvent<HTMLDivElement>) {
    if (blurStaysInSession(e.relatedTarget)) return
    finishEdit()
  }

  function dblclickText() {
    if (editable || p.lock) return
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
      onClick={onClick}
    >
      {p.textEffects && !editable
        ? p.textEffects.map((ef: any, efi: number) =>
            curved ? (
              <CurvedText key={efi + 'effect'} layout={curved} className="effect-text" style={{ fontFamily, ...effectStyle(ef) }} plain />
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
          // Real markup, not plaintext-only: a bolded word and a list item are
          // both elements, and the caret has to be able to move through them.
          // The editor's global shortcuts stand aside for an element like
          // this, so the keys the box needs are handled in `keydown`.
          contentEditable={editable}
          suppressContentEditableWarning
          onInput={() => writingText()}
          onPaste={paste}
          onCopy={copy}
          onCut={(e) => copy(e, true)}
          onKeyDown={keydown}
          onBlur={writeDone}
        />
      )}
      {editable ? <InlineToolbar color={p.color} onBoxToggle={boxToggle} /> : null}
      {loading ? <div className="w-text__loading" /> : null}
    </div>
  )
}

export default memo(WText)
