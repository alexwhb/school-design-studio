import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAppRoot } from '@/common/hooks/appRoot'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'

describe('the query string', () => {
  const replaceState = vi.fn()
  const hostState = { idx: 3, key: 'react-router' }

  beforeEach(() => {
    replaceState.mockReset()
    ;(globalThis as any).window = { location: { pathname: '/events/42/design', search: '?tab=design&edit=1', hash: '#top' }, history: { state: hostState, replaceState } }
  })
  afterEach(() => {
    setAppRoot(null)
    delete (globalThis as any).window
  })

  it('embedded, never reads or writes the host’s address', () => {
    setAppRoot({ isConnected: true } as unknown as HTMLElement)
    expect(readQuery()).toEqual({})
    replaceQuery({ tempid: '7', id: undefined })
    expect(replaceState).not.toHaveBeenCalled()
    expect(readQuery()).toEqual({ tempid: '7' })
  })

  it('standalone, writes the address and keeps the history entry’s state and hash', () => {
    expect(readQuery()).toEqual({ tab: 'design', edit: '1' })
    replaceQuery({ tempid: '7' })
    expect(replaceState).toHaveBeenCalledWith(hostState, '', '/events/42/design?tempid=7#top')
  })
})
