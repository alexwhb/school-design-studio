import { beforeEach, describe, expect, it, vi } from 'vitest'
import { canvasState, historyState, widgetState } from '@/store/state'
import { clearHistory, handleHistory } from '@/store/history'
import { setDLayouts } from '@/store/widget/widget'
import { fillPicture, takesPicture, withPicture } from '@/store/widget/fillPicture'
import { composeDeck, IMAGE_SLOT_ROLE } from '@/compose'
import { coverCrop } from '@/compose/widgets'
import type { TdLayout, TdWidgetData } from '@/store/types'

// `selectWidget` sets the active element on a timer; nothing here waits for it.
vi.useFakeTimers()

const photo = (over: Partial<TdWidgetData> = {}) =>
  ({
    uuid: 'photo',
    type: 'w-image',
    parent: '-1',
    left: 100,
    top: 50,
    width: 400,
    height: 400,
    imgUrl: '/old.jpg',
    originalImgUrl: '/old-original.jpg',
    alt: 'The old photo',
    zoom: 1.5,
    zoomY: 1.5,
    transform: ' scale(1.5, 1.5) translate(-40px, 12px)',
    mask: '/masks/circle.svg',
    radius: 24,
    borderWidth: 6,
    borderColor: '#ff0000ff',
    shadow: { x: 0, y: 8, blur: 12, color: '#00000055' },
    filters: { brightness: 110 },
    ...over,
  }) as unknown as TdWidgetData

function page(layers: TdWidgetData[]): TdLayout[] {
  return [{ global: { uuid: '-1', type: 'page', name: 'p', width: 1920, height: 1080, backgroundColor: '#fff' } as any, layers }]
}

beforeEach(() => {
  clearHistory()
  canvasState.dCurrentPage = 0
})

describe('coverCrop', () => {
  it('scales the axis it has to for the frame to be covered, and centres it', () => {
    expect(coverCrop({ width: 400, height: 400 }, { width: 800, height: 400 })).toEqual({ zoom: 2, zoomY: 1, transform: ' scale(2, 1) translate(0px, 0px)' })
    expect(coverCrop({ width: 400, height: 400 }, { width: 400, height: 800 })).toEqual({ zoom: 1, zoomY: 2, transform: ' scale(1, 2) translate(0px, 0px)' })
    // No size known: fill the frame as it is.
    expect(coverCrop({ width: 400, height: 200 }, { width: 0, height: 0 })).toEqual({ zoom: 1, zoomY: 1, transform: ' scale(1, 1) translate(0px, 0px)' })
  })
})

describe('withPicture', () => {
  it('keeps the frame, the mask, the keyline, the corners, the shadow and the adjustments', () => {
    const next = withPicture(photo(), { url: '/new.jpg', width: 1600, height: 800 }) as any
    expect(next).toMatchObject({ uuid: 'photo', left: 100, top: 50, width: 400, height: 400, imgUrl: '/new.jpg', mask: '/masks/circle.svg', radius: 24, borderWidth: 6, borderColor: '#ff0000ff', filters: { brightness: 110 } })
    expect(next.shadow).toEqual(photo().shadow)
    // Cropped to cover and centred: the old reframing is not carried over.
    expect(next.zoom).toBe(2)
    expect(next.zoomY).toBe(1)
    expect(next.transform).toBe(' scale(2, 1) translate(0px, 0px)')
    // What described or restored the old picture goes with it.
    expect(next.alt).toBeUndefined()
    expect(next.originalImgUrl).toBeUndefined()
  })

  it('turns a composed slide’s empty slot into the photo, where the slot was', () => {
    const deck = composeDeck({ title: 'x', slides: [{ layout: 'media', title: 'Library', kicker: null, sub: null, bullets: [], bulletsRight: [], columnHeads: [], callout: null, notes: null, image: null }] })
    const slot = deck.layouts[0].layers.find((layer) => layer.role === IMAGE_SLOT_ROLE) as TdWidgetData
    expect(slot.type).toBe('w-svg')
    expect(takesPicture(slot)).toBe(true)
    const next = withPicture(slot, { url: '/new.jpg', width: 800, height: 600 })
    expect(next).toMatchObject({ type: 'w-image', uuid: slot.uuid, left: slot.left, top: slot.top, width: slot.width, height: slot.height, imgUrl: '/new.jpg' })
  })

  it('takes pictures only where one belongs', () => {
    expect(takesPicture(photo())).toBe(true)
    expect(takesPicture(photo({ lock: true }))).toBe(false)
    expect(takesPicture(photo({ hidden: true }))).toBe(false)
    expect(takesPicture({ uuid: 's', type: 'w-svg' } as TdWidgetData)).toBe(false)
    expect(takesPicture({ uuid: 't', type: 'w-text' } as TdWidgetData)).toBe(false)
  })
})

describe('fillPicture', () => {
  it('is one step of undo, and undo puts the old picture back whole', () => {
    setDLayouts(page([photo()]))
    expect(fillPicture('photo', { url: '/new.jpg', width: 800, height: 400 })).toBe(true)
    expect(historyState.dHistoryParams.stackPointer).toBe(0)
    expect(widgetState.dWidgets[0]).toMatchObject({ imgUrl: '/new.jpg', mask: '/masks/circle.svg' })

    handleHistory('undo')
    const back = widgetState.dLayouts[0].layers[0] as any
    expect(back.imgUrl).toBe('/old.jpg')
    expect(back.alt).toBe('The old photo')
    expect(back.transform).toBe(' scale(1.5, 1.5) translate(-40px, 12px)')
    expect(historyState.dHistoryParams.stackPointer).toBe(-1)
  })

  it('refuses a layer that does not take pictures, so the caller can place it instead', () => {
    setDLayouts(page([photo({ lock: true })]))
    expect(fillPicture('photo', { url: '/new.jpg', width: 1, height: 1 })).toBe(false)
    expect(fillPicture('nobody', { url: '/new.jpg', width: 1, height: 1 })).toBe(false)
    expect(historyState.dHistoryParams.stackPointer).toBe(-1)
  })
})
