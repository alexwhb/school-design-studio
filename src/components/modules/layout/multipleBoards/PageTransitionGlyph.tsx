import { getTransitionSpec, readTransition } from '@/common/animations/transitions'
import type { TPageState } from '@/store/types'

/**
 * A small mark on a page's thumbnail when the page has a transition, so a
 * deck can be read for them without opening each page. Named in the tooltip
 * because the glyph is the same for all of them; what matters at a glance is
 * that there is one.
 */
export default function PageTransitionGlyph({ page }: { page: TPageState }) {
  const transition = readTransition(page)
  if (!transition) return null
  const name = getTransitionSpec(transition.type)?.name ?? 'Transition'
  return (
    <span className="page-transition" title={`${name} transition, ${transition.duration} ms`} data-transition={transition.type}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M2 4.5h6M2 8h9M2 11.5h6M11 5l3 3-3 3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
