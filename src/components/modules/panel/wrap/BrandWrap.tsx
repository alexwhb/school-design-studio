import { useState } from 'react'
import { useSnapshot } from 'valtio'
import fonts from '@/assets/data/FontsData'
import { recordHistory } from '@/common/hooks/history'
import {
  BRAND_FIELDS,
  MAX_BRAND_COLORS,
  SAMPLE_BRAND,
  brandResolver,
  brandState,
  hasBrandContent,
  normaliseBrandColor,
  updateBrandKit,
  type TBrandDetailKey,
  type TBrandKit,
} from '@/common/methods/brandKit'
import ApplyBrand from '@/components/business/brand-kit/ApplyBrand'
import Uploader, { type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import Button from '@/components/ui/Button'
import { CloseIcon } from '@/components/ui/icons'
import Input from '@/components/ui/Input'
import message from '@/components/ui/message'
import { PanelSection } from '@/components/ui/PanelSection'
import Popover from '@/components/ui/Popover'
import Select from '@/components/ui/Select'
import ColorPicker from '@/packages/color-picker/ColorPicker'
import { setShowMoveable } from '@/store/control'
import { widgetState } from '@/store/state'
import { applyBrandColorToSelection, insertBrandField, insertBrandLogo } from '@/store/widget/brand'
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

const FONT_OPTIONS = [{ label: 'Not chosen', value: 0 }, ...fonts.map((font) => ({ label: font.alias, value: font.id }))]

/** What a fresh swatch starts on: the navy the bundled templates are set in. */
const FIRST_COLOR = '#1e3a5fff'

/**
 * The Brand panel: the school's identity, kept in one place.
 *
 * Top to bottom it is the crest, the colours, the fonts, the written details
 * and the fields those details fill — and, pinned underneath, the button that
 * pushes all of it onto a design that was made without it. Everything typed
 * here is saved as it is typed (see brandKit.ts); nothing here needs a Save.
 */
export default function BrandWrap() {
  const { kit } = useSnapshot(brandState)
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState(FIRST_COLOR)
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

  function openAdd(open: boolean) {
    setAdding(open)
    // The picker's drags would otherwise fight the selection box, the same
    // way they would from a swatch in the settings panel.
    setShowMoveable(!open)
  }

  function addColor() {
    const color = normaliseBrandColor(draft)
    if (!color) return
    if (brandState.kit.colors.includes(color)) {
      message({ message: 'That colour is already in the kit.', type: 'info' })
    } else {
      updateBrandKit((next) => {
        next.colors.push(color)
      })
    }
    openAdd(false)
  }

  function removeColor(index: number) {
    updateBrandKit((next) => {
      next.colors.splice(index, 1)
    })
  }

  function applyColor(color: string) {
    let changed = 0
    recordHistory(() => {
      changed = applyBrandColorToSelection(color)
    })
    if (!changed) message({ message: 'Select some text, a shape or nothing at all — the page — to colour it.', type: 'info' })
  }

  function chooseFont(slot: 'heading' | 'body', value: string | number) {
    const id = Number(value)
    updateBrandKit((next) => {
      if (id) next.fonts[slot] = id
      else delete next.fonts[slot]
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
        <PanelSection title="Logo">
          {kit.logo ? (
            <div className="brand-logo">
              <div className="brand-logo__thumb transparent-bg">
                <img src={kit.logo.url} alt="School logo" />
              </div>
              <div className="brand-logo__actions">
                <Button size="small" plain onClick={addLogoToPage}>
                  Add to page
                </Button>
                <Button size="small" text onClick={removeLogo}>
                  Remove
                </Button>
              </div>
            </div>
          ) : null}
          <Uploader className="brand-upload" onDone={logoUploaded}>
            <Button plain>
              <i className="iconfont icon-upload" /> {kit.logo ? 'Replace logo' : 'Upload a logo'}
            </Button>
          </Uploader>
          <p className="brand-hint">A PNG or SVG with a transparent background sits best on a coloured page.</p>
        </PanelSection>

        <PanelSection title="Colours">
          <div className="brand-colours" role="list" aria-label="Brand colours">
            {kit.colors.map((color, index) => (
              <div key={`${color}-${index}`} className="brand-swatch" role="listitem">
                <button
                  type="button"
                  className="brand-swatch__chip"
                  style={{ background: color }}
                  title={color.slice(0, 7).toUpperCase()}
                  aria-label={`Apply ${color.slice(0, 7).toUpperCase()}`}
                  onClick={() => applyColor(color)}
                />
                <button type="button" className="brand-swatch__remove" aria-label="Remove colour" onClick={() => removeColor(index)}>
                  <CloseIcon />
                </button>
              </div>
            ))}
            {kit.colors.length < MAX_BRAND_COLORS ? (
              <Popover
                placement="bottom-start"
                width="auto"
                open={adding}
                onOpenChange={openAdd}
                content={
                  <div className="brand-add">
                    <ColorPicker value={draft} modes={['Solid']} onValueChange={setDraft} />
                    <Button type="primary" size="small" onClick={addColor}>
                      Add colour
                    </Button>
                  </div>
                }
              >
                <button type="button" className="brand-swatch brand-swatch--add" aria-label="Add a colour" title="Add a colour">
                  +
                </button>
              </Popover>
            ) : null}
          </div>
          <p className="brand-hint">
            {kit.colors.length
              ? 'Click a colour to put it on whatever is selected, or on the page when nothing is. The first is the main colour.'
              : 'Add the school’s colours, main colour first. They appear in every colour picker.'}
          </p>
        </PanelSection>

        <PanelSection title="Fonts">
          <div className="brand-font">
            <label className="brand-font__label" id="brand-font-heading">
              Headings
            </label>
            <Select value={kit.fonts.heading ?? 0} options={FONT_OPTIONS} className="brand-font__select" onChange={(value) => chooseFont('heading', value)} />
          </div>
          <div className="brand-font">
            <label className="brand-font__label" id="brand-font-body">
              Body
            </label>
            <Select value={kit.fonts.body ?? 0} options={FONT_OPTIONS} className="brand-font__select" onChange={(value) => chooseFont('body', value)} />
          </div>
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
      <div className="brand-wrap__footer">
        <Button type="primary" disabled={!canApply} onClick={() => setApplying(true)}>
          Apply brand to this design
        </Button>
      </div>
      <ApplyBrand open={applying} onOpenChange={setApplying} />
    </div>
  )
}
