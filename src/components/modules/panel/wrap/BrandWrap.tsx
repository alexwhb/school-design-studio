import { useState } from 'react'
import { useSnapshot } from 'valtio'
import { recordHistory } from '@/common/hooks/history'
import { BRAND_FIELDS, SAMPLE_BRAND, brandResolver, brandState, hasBrandContent, updateBrandKit, type TBrandDetailKey, type TBrandKit } from '@/common/methods/brandKit'
import ApplyBrand from '@/components/business/brand-kit/ApplyBrand'
import BrandColors from '@/components/business/brand-kit/BrandColors'
import BrandFonts from '@/components/business/brand-kit/BrandFonts'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import Button from '@/components/ui/Button'
import { CloseIcon, PlusIcon, StarIcon } from '@/components/ui/icons'
import Input from '@/components/ui/Input'
import message from '@/components/ui/message'
import { PanelSection } from '@/components/ui/PanelSection'
import { setShowMoveable } from '@/store/control'
import { widgetState } from '@/store/state'
import { insertBrandField, insertBrandLogo } from '@/store/widget/brand'
import './brandWrap.less'

const DETAILS: { key: TBrandDetailKey; label: string; id: string; type?: string }[] = [
  { key: 'name', label: 'School name', id: 'brand-name' },
  { key: 'shortName', label: 'Short name', id: 'brand-short-name' },
  { key: 'tagline', label: 'Tagline', id: 'brand-tagline' },
  { key: 'address', label: 'Address', id: 'brand-address' },
  { key: 'phone', label: 'Phone', id: 'brand-phone', type: 'tel' },
  { key: 'email', label: 'Email', id: 'brand-email', type: 'email' },
  { key: 'website', label: 'Website', id: 'brand-website' },
]

/**
 * The Brand panel: the school's identity, kept in one place.
 *
 * It opens on a card of the school itself — crest, name, and the button that
 * pushes the whole kit onto a design made without it — and then the pieces
 * that card is made of: the logo, the colours, the fonts, the written details
 * and the fields those details fill. Apply brand sits in the card rather than
 * pinned under the panel because it is the school's row, not a sixth section,
 * and because the sentence saying what it will do belongs next to it.
 *
 * Everything typed here is saved as it is typed (see brandKit.ts); nothing
 * here needs a Save.
 */
export default function BrandWrap() {
  const { kit } = useSnapshot(brandState)
  const pages = useSnapshot(widgetState).dLayouts.length || 1
  const [applying, setApplying] = useState(false)
  const resolve = brandResolver(kit as TBrandKit)

  function logoUploaded(file: TUploadDoneData) {
    updateBrandKit((next) => {
      next.logo = { url: file.url, width: file.width, height: file.height }
    })
  }

  function addLogoToPage() {
    const logo = brandState.kit.logo
    if (!logo) return
    setShowMoveable(false)
    recordHistory(() => insertBrandLogo(logo))
  }

  function removeLogo() {
    updateBrandKit((next) => {
      delete next.logo
    })
  }

  function setDetail(key: TBrandDetailKey, value: string) {
    updateBrandKit((next) => {
      next[key] = value
    })
  }

  function insertField(field: string) {
    const active = widgetState.dActiveElement
    const appending = !!active && active.uuid !== '-1' && active.type === 'w-text'
    // A new box is selected as it lands, the way one from the Text panel is;
    // the box already selected keeps its selection box.
    if (!appending) setShowMoveable(false)
    let how: 'appended' | 'added' = 'added'
    recordHistory(() => {
      how = insertBrandField(field)
    })
    if (how === 'added') message({ message: 'Added a text box carrying the field.', type: 'success' })
  }

  const canApply = hasBrandContent(kit as TBrandKit)

  return (
    <div className="wrap brand-wrap">
      <div className="brand-wrap__scroll">
        <div className="brand-card">
          <div className="brand-card__head">
            <div className="brand-card__crest transparent-bg">{kit.logo ? <img src={kit.logo.url} alt="" /> : null}</div>
            <div className="brand-card__names">
              <span className={kit.name ? 'brand-card__name' : 'brand-card__name brand-card__name--unset'}>{kit.name || 'Your school'}</span>
              <span className="brand-card__note">{kit.tagline || 'Kept in this browser'}</span>
            </div>
          </div>
          <Button type="primary" className="brand-card__apply" disabled={!canApply} onClick={() => setApplying(true)}>
            <StarIcon />
            Apply brand to this design
          </Button>
          <p className="brand-card__impact">
            {pages === 1 ? 'Swaps fonts and colours across this page.' : `Swaps fonts and colours across all ${pages} pages.`} Photos and uploads are left
            alone.
          </p>
        </div>

        <PanelSection title="Logo">
          <div className="brand-logos">
            {kit.logo ? (
              <div className="brand-logo">
                <button type="button" className="brand-logo__thumb transparent-bg" title="Add the logo to this page" onClick={addLogoToPage}>
                  <img src={kit.logo.url} alt="School logo" />
                </button>
                <span className="brand-logo__caption">primary</span>
                <button type="button" className="brand-logo__remove" aria-label="Remove the logo" title="Remove the logo" onClick={removeLogo}>
                  <CloseIcon />
                </button>
              </div>
            ) : null}
            <Uploader className="brand-upload" onDone={logoUploaded}>
              <PlusIcon />
              <span>{kit.logo ? 'Replace' : 'Upload'}</span>
            </Uploader>
          </div>
          <p className="brand-hint">
            A PNG or SVG with a transparent background sits best on a coloured page. {kit.logo ? 'Click it to put it on this page.' : ''}
          </p>
        </PanelSection>

        <PanelSection title="Colours">
          <BrandColors />
          <p className="brand-hint">
            {kit.colors.length
              ? 'Click a colour to put it on whatever is selected, or on the page when nothing is.'
              : 'Add the school’s colours, main colour first. They appear in every colour picker.'}
          </p>
        </PanelSection>

        <PanelSection title="Fonts">
          <BrandFonts />
          <p className="brand-hint">Chosen fonts appear first in the text panel’s font list.</p>
        </PanelSection>

        <PanelSection title="Details">
          {DETAILS.map((detail) => (
            <div key={detail.key} className="brand-field">
              <label className="brand-field__label" htmlFor={detail.id}>
                {detail.label}
              </label>
              <Input id={detail.id} type={detail.type} value={kit[detail.key]} placeholder={SAMPLE_BRAND[detail.key]} onChange={(value) => setDetail(detail.key, value)} />
            </div>
          ))}
        </PanelSection>

        <PanelSection title="Fields">
          {BRAND_FIELDS.map((item) => {
            const value = resolve(item.field)
            return (
              <button key={item.field} type="button" className="brand-token" title={`Insert ${item.label.toLowerCase()}`} onClick={() => insertField(item.field)}>
                <code>{`{{${item.field}}}`}</code>
                <span className="brand-token__value">{value ?? '—'}</span>
              </button>
            )
          })}
          <p className="brand-hint">
            Click one to add it to the selected text box, or to a new one. Templates fill these in as they are added; Apply brand fills any still
            standing.
          </p>
        </PanelSection>
      </div>
      <ApplyBrand open={applying} onOpenChange={setApplying} />
    </div>
  )
}
