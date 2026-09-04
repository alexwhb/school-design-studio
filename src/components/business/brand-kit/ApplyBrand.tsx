import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Dialog from '@/components/ui/Dialog'
import useNotification from '@/common/methods/notification'
import { recordHistory } from '@/common/hooks/history'
import { brandFont, brandState, snapshotBrandKit } from '@/common/methods/brandKit'
import { canvasState } from '@/store/state'
import { applyBrandToDesign, describeBrandOutcome, headingThreshold, noReadabilityCounts, type TApplyBrandOutcome } from '@/store/widget/brand'
import './applyBrand.less'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Apply brand to this design.
 *
 * For the design that was made before the kit was, or brought in from
 * somewhere else: every school field on every page is filled in, the text is
 * set in the school's fonts, and — if asked — the design's colours become the
 * school's. One dialog, one confirmation, one undo step. The rules are said
 * here rather than left to be discovered, because the font pass in particular
 * has to guess which lines are headings and the guess should be checkable.
 */
export default function ApplyBrand({ open, onOpenChange }: Props) {
  const kit = useSnapshot(brandState).kit
  const page = useSnapshot(canvasState).dPage
  const [recolour, setRecolour] = useState(false)

  // Whether to recolour is asked afresh each time, and defaults to yes only
  // when there are colours to recolour with.
  useEffect(() => {
    if (open) setRecolour(kit.colors.length > 0)
  }, [open, kit.colors.length])

  const heading = brandFont(kit.fonts.heading)
  const body = brandFont(kit.fonts.body)
  const threshold = headingThreshold(page)

  function fontRule(): string {
    if (heading && body && heading.id !== body.id) {
      return `Bold text, and text ${threshold} px or larger on this page, is set in ${heading.alias}. Everything else is set in ${body.alias}.`
    }
    const only = heading || body
    if (only) return `Every text box is set in ${only.alias}, the one font the kit has.`
    return 'No fonts are chosen in the kit, so text keeps the fonts it has.'
  }

  function apply() {
    let outcome: TApplyBrandOutcome = { filled: 0, fieldPages: 0, unresolved: 0, fonts: 0, recoloured: 0, backgrounds: 0, readability: noReadabilityCounts() }
    const plain = snapshotBrandKit()
    // One undo step, however many pages it touches.
    recordHistory(() => {
      outcome = applyBrandToDesign(plain, { fields: true, fonts: !!(heading || body), colors: recolour && plain.colors.length > 0 })
    })
    onOpenChange(false)
    useNotification('Brand applied', describeBrandOutcome(outcome), { type: 'success' })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Apply brand to this design"
      width={420}
      className="ds-apply-brand"
      footer={
        <>
          <Button onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="primary" onClick={apply}>
            Apply
          </Button>
        </>
      }
    >
      <p className="ds-apply-brand__line">
        Every <code>{'{{school.…}}'}</code> field on every page is filled in from the kit.
      </p>
      <p className="ds-apply-brand__line">{fontRule()}</p>
      <div className="ds-apply-brand__option">
        {/* No checkbox with an empty kit: a tick box that cannot change
            anything is worse than saying why there is nothing to choose. */}
        {kit.colors.length ? (
          <>
            <Checkbox value={recolour} label="Recolour with brand colours" onChange={setRecolour} />
            <p className="ds-apply-brand__note">The colours this design uses most become the kit’s, in the same order. Whites, blacks and greys are left alone.</p>
          </>
        ) : (
          <p className="ds-apply-brand__note">There are no colours in the kit, so nothing is recoloured. Add some in the Brand panel and run this again.</p>
        )}
      </div>
      <p className="ds-apply-brand__line ds-apply-brand__line--quiet">One press of Undo takes the whole thing back.</p>
    </Dialog>
  )
}
