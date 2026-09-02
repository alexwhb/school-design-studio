/**
 * The small bar that floats over a selection while a text box is being typed
 * in: bold, italic, underline, strikethrough, a colour and a link, so styling
 * one word does not mean looking away to the panel. What it does goes through
 * the session in inlineFormat.ts, the same as the panel's own buttons.
 *
 * Drawn into the app's portal container so it sits over everything the way a
 * menu does, and placed from the selection's own rectangle on screen — which
 * the session keeps current as the caret moves and the page scrolls.
 */
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSnapshot } from 'valtio'
import { getPortalContainer } from '@/common/hooks/appRoot'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Popover from '@/components/ui/Popover'
import Tooltip from '@/components/ui/Tooltip'
import { LinkedIcon } from '@/components/ui/icons'
import { cx } from '@/utils/dom'
import ColorSelect from '../../settings/ColorSelect'
import { colourInline, inlineState, linkInline, toggleInline, unlinkInline, type TInlineKind } from './inlineFormat'
import './inlineToolbar.less'

const TOGGLES: { kind: TInlineKind; icon: string; tip: string }[] = [
  { kind: 'bold', icon: 'icon-bold', tip: 'Bold (Ctrl+B)' },
  { kind: 'italic', icon: 'icon-italic', tip: 'Italic (Ctrl+I)' },
  { kind: 'underline', icon: 'icon-underline', tip: 'Underline (Ctrl+U)' },
  { kind: 'strike', icon: 'icon-strikethrough', tip: 'Strikethrough' },
]

/** How far the bar stands off the top of the selection. */
const GAP = 10

type Props = {
  /** The box's own colour, which is what an uncoloured selection shows as. */
  color: string
  /**
   * Takes a style off the whole box. Pressing Bold in a box that is bold all
   * over means the box — there is no such thing as a less-bold word inside it,
   * see inlineFormat.ts — so the bar falls back to this the way the panel does.
   */
  onBoxToggle: (kind: TInlineKind) => void
}

export default function InlineToolbar({ color, onBoxToggle }: Props) {
  const state = useSnapshot(inlineState)
  const [linkOpen, setLinkOpen] = useState(false)
  const [url, setUrl] = useState('')
  const urlField = useRef<HTMLInputElement | null>(null)

  // The link field opens on whatever link the selection is already in, so it
  // can be corrected rather than retyped.
  useEffect(() => {
    if (!linkOpen) return
    setUrl(state.href)
    // The popover leaves focus where it was; the field is what is wanted here.
    requestAnimationFrame(() => urlField.current?.focus())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkOpen])

  const rect = state.rect
  // A bare caret has nothing to stand over — unless it is inside a link, when
  // the link is what it stands over, so it can be opened or taken off.
  if (!rect || !(state.selected || state.href)) return null

  const left = Math.min(Math.max(rect.left + rect.width / 2, 120), window.innerWidth - 120)
  const top = Math.max(rect.top - GAP, 48)

  function applyLink() {
    if (linkInline(url)) setLinkOpen(false)
  }

  function removeLink() {
    unlinkInline()
    setLinkOpen(false)
  }

  const bar = (
    <div
      className="inline-toolbar"
      style={{ left, top }}
      // A press on the bar itself must not take focus, and the selection with
      // it, out of the text. The check is on where the press landed in the
      // document: a popover opened from here bubbles through the React tree
      // too, and its own fields have to be able to take focus.
      onMouseDown={(e) => {
        if (e.currentTarget.contains(e.target as Node)) e.preventDefault()
      }}
    >
      {TOGGLES.map((item) => (
        <Tooltip key={item.kind} content={item.tip} placement="top" showAfter={300}>
          <button type="button" className={cx('inline-toolbar__btn', { active: state[item.kind] })} aria-label={item.tip} onClick={() => toggleInline(item.kind) || onBoxToggle(item.kind)}>
            <i className={`iconfont ${item.icon}`} />
          </button>
        </Tooltip>
      ))}
      <span className="inline-toolbar__rule" />
      <ColorSelect value={state.color || color} width="auto" className="inline-toolbar__colour" keepOpenOnFocusOutside onValueChange={colourInline} />
      <Popover
        placement="bottom"
        width={280}
        open={linkOpen}
        onOpenChange={setLinkOpen}
        keepOpenOnFocusOutside
        popperClass="inline-toolbar__link-pop"
        content={
          <div className="inline-link">
            <Input
              ref={urlField}
              value={url}
              placeholder="www.school.org/trips"
              className="inline-link__url"
              onChange={setUrl}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  applyLink()
                }
              }}
            />
            <div className="inline-link__row">
              <Button size="small" type="primary" disabled={!url.trim()} onClick={applyLink}>
                {state.href ? 'Change' : 'Add link'}
              </Button>
              <Button size="small" disabled={!state.href} onClick={() => window.open(state.href, '_blank', 'noopener')}>
                Open
              </Button>
              <Button size="small" disabled={!state.href} onClick={removeLink}>
                Remove
              </Button>
            </div>
          </div>
        }
      >
        <button type="button" className={cx('inline-toolbar__btn', { active: !!state.href })} aria-label="Link" title="Link">
          <LinkedIcon className="inline-toolbar__svg" />
        </button>
      </Popover>
    </div>
  )

  return createPortal(bar, getPortalContainer() ?? document.body)
}
