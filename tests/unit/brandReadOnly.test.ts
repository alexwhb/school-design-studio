import { beforeEach, describe, expect, it } from 'vitest'
import { brandState, setBrandReadOnly, updateBrandKit } from '@/common/methods/brandKit'

/**
 * The panel greying itself out is what somebody sees; this is what actually
 * stops the kit changing. `updateBrandKit` is the one door into it — the panel,
 * the colour editor and the font picker all go through it — so a guard here
 * cannot be got round by a control that was forgotten, or by a host reaching
 * past the interface entirely.
 */
describe('a brand kit somebody else looks after', () => {
  beforeEach(() => {
    setBrandReadOnly(false)
    updateBrandKit((kit) => {
      kit.name = 'Riverbend Academy'
      kit.colors = ['#7c3aedff']
    })
  })

  it('takes an edit when it is not locked', () => {
    updateBrandKit((kit) => {
      kit.name = 'Riverbend Middle'
    })
    expect(brandState.kit.name).toBe('Riverbend Middle')
  })

  it('refuses every edit when it is', () => {
    setBrandReadOnly(true)
    updateBrandKit((kit) => {
      kit.name = 'Somewhere Else Academy'
    })
    updateBrandKit((kit) => {
      kit.colors = ['#ff0000ff']
      delete kit.logo
      kit.fonts.heading = 2
    })
    expect(brandState.kit.name).toBe('Riverbend Academy')
    expect(brandState.kit.colors).toEqual(['#7c3aedff'])
    expect(brandState.kit.fonts.heading).toBeUndefined()
  })

  it('does not throw, so a click handler that reaches it survives', () => {
    setBrandReadOnly(true)
    expect(() =>
      updateBrandKit((kit) => {
        kit.name = 'x'
      }),
    ).not.toThrow()
  })

  it('takes edits again once it is unlocked', () => {
    setBrandReadOnly(true)
    updateBrandKit((kit) => {
      kit.name = 'Nope'
    })
    setBrandReadOnly(false)
    updateBrandKit((kit) => {
      kit.name = 'Riverbend Middle'
    })
    expect(brandState.kit.name).toBe('Riverbend Middle')
  })
})
