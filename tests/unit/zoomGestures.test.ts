import { describe, expect, it } from 'vitest'
import { isMouseWheel } from '@/common/methods/addWheelZoom'
import zoomKey from '@/mixins/methods/zoomKey'

function wheel(props: Partial<WheelEvent> & { wheelDeltaY?: number }) {
  return { deltaMode: 0, deltaX: 0, deltaY: 0, ...props } as any
}

describe('telling a mouse wheel from a trackpad', () => {
  it('takes a notch of a wheel, and a fast spin of several', () => {
    expect(isMouseWheel(wheel({ deltaY: 100, wheelDeltaY: -120 }))).toBe(true)
    expect(isMouseWheel(wheel({ deltaY: -100, wheelDeltaY: 120 }))).toBe(true)
    expect(isMouseWheel(wheel({ deltaY: 300, wheelDeltaY: -360 }))).toBe(true)
  })

  it('leaves two fingers on a trackpad alone', () => {
    // Fine, fractional, and usually not straight down the page.
    expect(isMouseWheel(wheel({ deltaY: 4, wheelDeltaY: -12 }))).toBe(false)
    expect(isMouseWheel(wheel({ deltaY: 0.5, wheelDeltaY: -1.5 }))).toBe(false)
    expect(isMouseWheel(wheel({ deltaX: 3, deltaY: 11, wheelDeltaY: -33 }))).toBe(false)
  })

  it('reads whole lines as a wheel, which is how Firefox reports one', () => {
    expect(isMouseWheel(wheel({ deltaMode: 1, deltaY: 3 }))).toBe(true)
    expect(isMouseWheel(wheel({ deltaMode: 0, deltaY: 57 }))).toBe(false)
  })
})

describe('the zoom keys', () => {
  const key = (props: Partial<KeyboardEvent>) => zoomKey({ keyCode: 0, ...props } as KeyboardEvent)

  it('zooms in on either plus', () => {
    expect(key({ key: '=' })).toBe('in')
    expect(key({ key: '+' })).toBe('in')
  })

  it('zooms out on either minus', () => {
    expect(key({ key: '-' })).toBe('out')
    expect(key({ key: '_' })).toBe('out')
  })

  it('fits on zero', () => {
    expect(key({ key: '0' })).toBe('fit')
  })

  it('falls back to the key codes the browsers disagree about', () => {
    expect(key({ keyCode: 187 })).toBe('in') // = in Chrome
    expect(key({ keyCode: 61 })).toBe('in') // = in Firefox
    expect(key({ keyCode: 107 })).toBe('in') // the keypad
    expect(key({ keyCode: 189 })).toBe('out')
    expect(key({ keyCode: 173 })).toBe('out')
    expect(key({ keyCode: 109 })).toBe('out')
  })

  it('leaves every other shortcut to the switch below it', () => {
    expect(key({ key: 's', keyCode: 83 })).toBe(null)
    expect(key({ key: 'z', keyCode: 90 })).toBe(null)
    expect(key({ key: ']', keyCode: 221 })).toBe(null)
  })
})
