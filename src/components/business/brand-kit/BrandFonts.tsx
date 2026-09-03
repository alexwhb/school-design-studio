import { useState } from 'react'
import { useSnapshot } from 'valtio'
import fonts from '@/assets/data/FontsData'
import { brandFont, brandState, updateBrandKit } from '@/common/methods/brandKit'
import { CheckIcon } from '@/components/ui/icons'
import Popover from '@/components/ui/Popover'
import { cx } from '@/utils/dom'
import './brandFonts.less'

type TSlot = 'heading' | 'body'

const SLOTS: { slot: TSlot; caption: string }[] = [
  { slot: 'heading', caption: 'headings' },
  { slot: 'body', caption: 'body' },
]

/**
 * The two fonts the school writes in, each shown set in itself.
 *
 * A font name in the interface font tells you nothing you did not already
 * know; the point of the card is that "Playfair Display" is drawn in Playfair
 * Display, at roughly the weight the pass will use it at — a heading at 17px
 * bold, body copy at 15px — so the pair can be judged against each other
 * before it is applied to a whole design.
 */
export default function BrandFonts() {
  const { kit } = useSnapshot(brandState)
  const [open, setOpen] = useState<TSlot | null>(null)

  function choose(slot: TSlot, id: number) {
    updateBrandKit((next) => {
      if (id) next.fonts[slot] = id
      else delete next.fonts[slot]
    })
    setOpen(null)
  }

  return (
    <div className="brand-fonts">
      {SLOTS.map(({ slot, caption }) => {
        const chosen = brandFont(kit.fonts[slot])
        return (
          <Popover
            key={slot}
            placement="bottom"
            width={252}
            popperClass="brand-fonts__popper"
            open={open === slot}
            onOpenChange={(next) => setOpen(next ? slot : null)}
            content={
              <div className="brand-fonts__list" role="listbox" aria-label={`${caption} font`}>
                <button type="button" className={cx('brand-fonts__option', { 'is-on': !chosen })} role="option" aria-selected={!chosen} onClick={() => choose(slot, 0)}>
                  <span className="brand-fonts__option-name">Not chosen</span>
                  {!chosen ? <CheckIcon /> : null}
                </button>
                {fonts.map((font) => (
                  <button
                    key={font.id}
                    type="button"
                    className={cx('brand-fonts__option', { 'is-on': chosen?.id === font.id })}
                    role="option"
                    aria-selected={chosen?.id === font.id}
                    onClick={() => choose(slot, font.id)}
                  >
                    <span className="brand-fonts__option-name" style={{ fontFamily: font.value }}>
                      {font.alias}
                    </span>
                    {chosen?.id === font.id ? <CheckIcon /> : null}
                  </button>
                ))}
              </div>
            }
          >
            <button type="button" className={cx('brand-font', `brand-font--${slot}`, { 'brand-font--empty': !chosen })} aria-label={`${caption} font`}>
              <span className="brand-font__name" style={chosen ? { fontFamily: chosen.value } : undefined}>
                {chosen ? chosen.alias : 'Not chosen'}
              </span>
              <span className="brand-font__caption">{caption}</span>
            </button>
          </Popover>
        )
      })}
    </div>
  )
}
