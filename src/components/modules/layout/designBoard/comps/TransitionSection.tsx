/**
 * The Transition section of the page settings panel.
 *
 * One choice from a short list, a duration, a way to see it without leaving
 * the editor, and a way to give the whole deck the same one — which is what
 * nearly everyone wants, and what is tedious to do page by page.
 */
import { useEffect, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import Button from '@/components/ui/Button'
import { PanelSection } from '@/components/ui/PanelSection'
import Select from '@/components/ui/Select'
import message from '@/components/ui/message'
import NumberSlider from '@/components/modules/settings/NumberSlider'
import { applyTransitionToAllPages, setPageTransition } from '@/store/widget/pageMeta'
import { widgetState } from '@/store/state'
import { DEFAULT_TRANSITION_DURATION, MAX_TRANSITION_DURATION, MIN_TRANSITION_DURATION, TRANSITIONS, cancelTransitions, getTransitionSpec, previewTransition, readTransition, type TTransitionType } from '@/common/animations/transitions'
import type { TPageState } from '@/store/types'
import './transitionSection.less'

const OPTIONS = TRANSITIONS.map((spec) => ({ label: spec.name, value: spec.id }))

export default function TransitionSection({ page }: { page: TPageState }) {
  // Read through the snapshot: adding or deleting a page has to enable and
  // disable "Apply to all pages" as it happens.
  const pageCount = useSnapshot(widgetState).dLayouts.length
  const transition = readTransition(page)
  const type: TTransitionType = transition?.type ?? 'none'
  const spec = getTransitionSpec(type)
  const running = useRef<Animation[]>([])
  const [previewing, setPreviewing] = useState(false)

  useEffect(() => () => cancelTransitions(running.current), [])

  function choose(next: string | number) {
    const id = String(next) as TTransitionType
    if (id === 'none') setPageTransition(null)
    else setPageTransition({ type: id, duration: transition?.duration ?? DEFAULT_TRANSITION_DURATION })
  }

  function setDuration(duration: number) {
    if (!transition) return
    setPageTransition({ type: transition.type, duration })
  }

  /** Plays the arriving half of the transition on the canvas itself. */
  function preview() {
    const el = document.getElementById('page-design-canvas')
    if (!el || !transition) return
    cancelTransitions(running.current)
    running.current = previewTransition(el, transition)
    setPreviewing(true)
    Promise.all(running.current.map((a) => a.finished.catch(() => undefined))).then(() => setPreviewing(false))
  }

  function applyToAll() {
    const count = applyTransitionToAllPages()
    message({ message: transition ? `${spec?.name} applied to ${count} ${count === 1 ? 'page' : 'pages'}.` : `Transitions removed from ${count} ${count === 1 ? 'page' : 'pages'}.`, type: 'success' })
  }

  return (
    <PanelSection name="3" title="Transition">
      <div className="ds-transition">
        <Select className="ds-transition__type" value={type} options={OPTIONS} onChange={choose} />
        <p className="ds-transition__hint">{spec?.hint}</p>
        {transition ? (
          <>
            <div className="slide-wrap">
              <NumberSlider label="Duration (ms)" value={transition.duration} minValue={MIN_TRANSITION_DURATION} maxValue={MAX_TRANSITION_DURATION} step={50} onChange={setDuration} />
            </div>
            <div className="ds-transition__actions">
              <Button plain size="small" disabled={previewing} onClick={preview}>
                {previewing ? 'Playing…' : 'Preview'}
              </Button>
              <Button plain size="small" disabled={pageCount < 2} onClick={applyToAll} title={pageCount < 2 ? 'There is only one page' : undefined}>
                Apply to all pages
              </Button>
            </div>
          </>
        ) : pageCount > 1 ? (
          <div className="ds-transition__actions">
            <Button plain size="small" onClick={applyToAll}>
              Remove from all pages
            </Button>
          </div>
        ) : null}
        <p className="ds-transition__note">Plays in the presenter. PowerPoint files do not carry transitions.</p>
      </div>
    </PanelSection>
  )
}
