import { createContext, useContext, useState, type ReactNode } from 'react'
import { cx } from '@/utils/dom'
import { ArrowRightIcon } from './icons'
import './panelSection.less'

/**
 * A named block of settings, and the only way the panels draw one.
 *
 * There used to be two: a collapse whose header was 44px tall with a chevron,
 * and a hand-rolled 28px row with a status and a Choose button on the right —
 * Animation and Text effects. Both called the same `.section-label()` mixin for
 * the type, so they looked related without ever lining up, and a panel that
 * showed all three read as three different kinds of thing.
 *
 * A section is collapsible when it is inside a `PanelSections` group or given
 * `open`/`onToggle`; otherwise it is a plain heading over its content, and
 * `aside` puts controls on the right of that heading either way.
 */
const SectionGroup = createContext<{ open: string[]; toggle: (name: string) => void } | null>(null)

type Props = {
  name?: string
  title: ReactNode
  /** Controls sitting at the right-hand end of the heading row. */
  aside?: ReactNode
  children: ReactNode
  /** Set to drive a lone section's open state from outside a group. */
  open?: boolean
  onToggle?: (name: string) => void
  className?: string
}

export function PanelSection({ name = '', title, aside, children, open, onToggle, className }: Props) {
  const group = useContext(SectionGroup)
  const toggle = onToggle || group?.toggle
  // A section with nothing to toggle it is a heading, not a disclosure, so it
  // does not draw a chevron you cannot use.
  const collapsible = !!toggle
  const isOpen = typeof open === 'boolean' ? open : collapsible ? !!group?.open.includes(name) : true

  const heading = (
    <>
      <span className="ds-section__title">{title}</span>
      {aside ? (
        // Whatever is in here is its own control, so a click on it must not
        // also fold the section it sits in.
        <div className="ds-section__aside" onClick={(e) => e.stopPropagation()}>
          {aside}
        </div>
      ) : null}
    </>
  )

  return (
    <div className={cx('ds-section', { 'is-open': isOpen, 'is-collapsible': collapsible }, className || '')}>
      <div className="ds-section__head">
        {collapsible ? (
          <button type="button" className="ds-section__toggle" aria-expanded={isOpen} onClick={() => toggle?.(name)}>
            {heading}
            <i className="ds-section__arrow" aria-hidden="true">
              <ArrowRightIcon />
            </i>
          </button>
        ) : (
          <div className="ds-section__toggle ds-section__toggle--static">{heading}</div>
        )}
      </div>
      <div className="ds-section__body" style={{ display: isOpen ? undefined : 'none' }}>
        {children}
      </div>
    </div>
  )
}

export default function PanelSections({ value, onChange, children, className }: { value: string[]; onChange: (next: string[]) => void; children: ReactNode; className?: string }) {
  const toggle = (name: string) => {
    onChange(value.includes(name) ? value.filter((v) => v !== name) : [...value, name])
  }
  return (
    <SectionGroup.Provider value={{ open: value, toggle }}>
      <div className={cx('ds-sections', className || '')}>{children}</div>
    </SectionGroup.Provider>
  )
}

export function useSections(initial: string[]) {
  return useState<string[]>(initial)
}
