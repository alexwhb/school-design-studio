import { forwardRef, useCallback, useEffect, useImperativeHandle, useState } from 'react'
import { useSnapshot } from 'valtio'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Checkbox from '@/components/ui/Checkbox'
import message from '@/components/ui/message'
import { recordHistory } from '@/common/hooks/history'
import { widgetState } from '@/store/state'
import { applyReplace, applyReplaceAll, findMatches, pagesTouched, revealMatch, type TFindMatch, type TReplaceOutcome, type TSearchScope } from '@/store/widget/findReplace'
import { cx } from '@/utils/dom'
import './findReplace.less'

export type FindReplaceHandle = {
  open: () => void
}

function countText(matches: TFindMatch[], cursor: number | null, scope: TSearchScope, query: string): string {
  if (!query) return 'Type the words you want to change.'
  if (matches.length === 0) return `Nothing on this design says “${query}”.`
  const pages = pagesTouched(matches)
  const where = scope === 'page' ? 'on this page' : pages === 1 ? 'on one page' : `on ${pages} pages`
  if (cursor === null) return `${matches.length} ${matches.length === 1 ? 'match' : 'matches'}, ${where}`
  return `${cursor + 1} of ${matches.length}, ${where}`
}

function outcomeText({ replaced, pages, unseen }: TReplaceOutcome): string {
  const where = pages === 1 ? 'on one page' : `across ${pages} pages`
  const note = unseen ? ` ${unseen} of them ${unseen === 1 ? 'is' : 'are'} on a hidden or locked layer.` : ''
  return `Replaced ${replaced} ${replaced === 1 ? 'match' : 'matches'} ${where}.${note}`
}

/**
 * Find and replace.
 *
 * Built for the long designs — the assembly deck, the newsletter, the set of
 * certificates — where the same date or the same name is typed into a dozen
 * boxes spread over a dozen pages. Retyping those by hand is twenty-five
 * chances to miss one, and the one that gets missed goes to the print shop.
 *
 * So the search is over the whole design by default, and both ways of working
 * are here: Replace all for the common case, and Previous/Next stepping to the
 * match — changing page and selecting the box that holds it — for a string
 * short enough to turn up somewhere it was not meant to.
 *
 * Counts and outcomes are spoken out loud, because most of what a Replace all
 * changed is on a page nobody is looking at. A silent one is unnerving.
 */
const FindReplace = forwardRef<FindReplaceHandle, {}>(function FindReplace(_props, ref) {
  const pageCount = useSnapshot(widgetState).dLayouts.length || 1

  const [visible, setVisible] = useState(false)
  const [query, setQuery] = useState('')
  const [replacement, setReplacement] = useState('')
  const [matchCase, setMatchCase] = useState(false)
  const [scope, setScope] = useState<TSearchScope>('all')
  const [matches, setMatches] = useState<TFindMatch[]>([])
  /** Which match is being looked at, or null for "the search has not been walked yet". */
  const [cursor, setCursor] = useState<number | null>(null)

  // Radix mounts the dialog's content a tick after it opens, so a ref taken on
  // mount is null and never seen again. Track the node in state instead, and
  // put the caret in it once the focus trap has finished with it.
  const [findField, setFindField] = useState<HTMLInputElement | null>(null)
  const takeFindField = useCallback((node: HTMLInputElement | null) => setFindField(node), [])
  useEffect(() => {
    if (!findField) return
    const timer = setTimeout(() => {
      findField.focus()
      findField.select()
    }, 0)
    return () => clearTimeout(timer)
  }, [findField])

  /** Re-runs the search, taking whichever setting is being changed as it changes. */
  function research(next: Partial<{ query: string; matchCase: boolean; scope: TSearchScope }> = {}) {
    const found = findMatches({ query, matchCase, scope, ...next })
    setMatches(found)
    setCursor(null)
    return found
  }

  const open = () => {
    setVisible(true)
    // The design may have moved on since this was last open, so the previous
    // search is run again rather than shown as it was left.
    setMatches(findMatches({ query, matchCase, scope }))
    setCursor(null)
  }

  useImperativeHandle(ref, () => ({ open }))

  function step(delta: number) {
    if (matches.length === 0) return
    const from = cursor === null ? (delta > 0 ? -1 : 0) : cursor
    const next = (from + delta + matches.length) % matches.length
    setCursor(next)
    revealMatch(matches[next])
  }

  function replaceCurrent() {
    const at = cursor ?? 0
    const match = matches[at]
    if (!match) return
    recordHistory(() => applyReplace(match, replacement))
    const found = findMatches({ query, matchCase, scope })
    setMatches(found)
    if (found.length === 0) {
      setCursor(null)
      return
    }
    // The one that was replaced has left the list, so the same position is now
    // the next one along — step onto it rather than making them press Next.
    const next = Math.min(at, found.length - 1)
    setCursor(next)
    revealMatch(found[next])
  }

  function replaceEverything() {
    if (matches.length === 0) return
    // One undo step, not eleven: the whole sweep is bracketed as a single
    // change, so Ctrl+Z once puts the design back the way it was.
    let outcome: TReplaceOutcome = { replaced: 0, pages: 0, unseen: 0 }
    recordHistory(() => {
      outcome = applyReplaceAll(matches, replacement)
    })
    setMatches(findMatches({ query, matchCase, scope }))
    setCursor(null)
    message({ message: outcomeText(outcome), type: 'success' })
  }

  function onFieldKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    step(e.shiftKey ? -1 : 1)
  }

  const nothingFound = matches.length === 0

  return (
    <Dialog open={visible} onOpenChange={setVisible} title="Find and replace" width={400} className="ds-find-replace">
      <div className="field">
        <label className="field__label" htmlFor="find-replace-find">
          Find
        </label>
        <Input
          id="find-replace-find"
          ref={takeFindField}
          value={query}
          onChange={(value) => {
            setQuery(value)
            research({ query: value })
          }}
          onKeyDown={onFieldKey}
        />
      </div>
      <div className="field">
        <label className="field__label" htmlFor="find-replace-with">
          Replace
        </label>
        <Input id="find-replace-with" value={replacement} onChange={setReplacement} onKeyDown={onFieldKey} />
      </div>

      <div className="options">
        <Checkbox
          value={matchCase}
          label="Match case"
          onChange={(value) => {
            setMatchCase(value)
            research({ matchCase: value })
          }}
        />
        {pageCount > 1 ? (
          <div className="scopes">
            <span className="scopes__label">Search</span>
            {(
              [
                ['all', 'All pages'],
                ['page', 'This page'],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={cx('scope', { 'is-on': scope === value })}
                aria-pressed={scope === value}
                onClick={() => {
                  setScope(value)
                  research({ scope: value })
                }}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="tally" role="status">
        {countText(matches, cursor, scope, query)}
      </p>

      <div className="actions">
        <div className="actions__group">
          <Button disabled={nothingFound} onClick={() => step(-1)}>
            Previous
          </Button>
          <Button disabled={nothingFound} onClick={() => step(1)}>
            Next
          </Button>
        </div>
        <div className="actions__group">
          <Button disabled={nothingFound} onClick={replaceCurrent}>
            Replace
          </Button>
          <Button type="primary" disabled={nothingFound} onClick={replaceEverything}>
            Replace all
          </Button>
        </div>
      </div>
    </Dialog>
  )
})

export default FindReplace
