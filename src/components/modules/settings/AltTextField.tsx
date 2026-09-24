import { useEffect, useState } from 'react'
import Checkbox from '@/components/ui/Checkbox'
import { recordHistory } from '@/common/hooks/history'
import { updateWidgetData } from '@/store/widget'
import './altTextField.less'

type Props = {
  uuid: string
  alt?: string
  decorative?: boolean
  /** One line on what happens to the description for this kind of element. */
  hint?: string
}

/** Long enough for two good sentences, which is more than alt text should be. */
export const ALT_MAX_LENGTH = 300

/**
 * The one place a picture gets described.
 *
 * Without it an exported PDF is a stack of photographs to a screen reader, and
 * a PowerPoint announces every picture by a file name. The box is small; what
 * rests on it is not, which is why it is a plain field in the panel rather than
 * something behind a menu.
 *
 * "Decorative" is a real answer, not a way out. A swoosh along the bottom of a
 * poster has nothing to say, and describing it makes the page worse to listen
 * to, but somebody has to decide that. The checkbox is that decision, and it
 * is what tells the check before a download not to ask about it again.
 *
 * Ported from the alt-text work on `t3code/accessible-pdf-export-and-alt-text`.
 */
export default function AltTextField({ uuid, alt, decorative, hint }: Props) {
  // Held here while typing, so a sentence is not a store write and an undo
  // step per key.
  const [draft, setDraft] = useState(alt || '')

  useEffect(() => {
    setDraft(alt || '')
  }, [uuid, alt])

  function commit(value: string) {
    const next = value.trim().slice(0, ALT_MAX_LENGTH)
    if (next === (alt || '').trim()) return
    recordHistory(() => updateWidgetData({ uuid, key: 'alt' as any, value: next }))
  }

  function setDecorative(value: boolean) {
    recordHistory(() => {
      updateWidgetData({ uuid, key: 'decorative' as any, value })
      // Saying there is nothing to describe and keeping a description would
      // put both into the file, and the description would win.
      if (value && (alt || draft)) updateWidgetData({ uuid, key: 'alt' as any, value: '' })
    })
    if (value) setDraft('')
  }

  return (
    <div className="alt-text">
      <textarea className="alt-text__input" aria-label="Alt text" rows={2} maxLength={ALT_MAX_LENGTH} value={draft} disabled={!!decorative} placeholder={decorative ? 'Marked as decorative' : 'What does it show?'} onChange={(e) => setDraft(e.target.value)} onBlur={() => commit(draft)} />
      <Checkbox size="small" className="alt-text__decorative" value={!!decorative} label="Decorative, nothing to describe" onChange={setDecorative} />
      {hint ? <p className="alt-text__hint">{hint}</p> : null}
    </div>
  )
}
