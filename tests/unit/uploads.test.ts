import { describe, expect, it } from 'vitest'
import { explainUploadError } from '@/common/methods/localUploads'

describe('telling somebody why a photo was not removed', () => {
  it('uses the host’s own words', () => {
    expect(explainUploadError(new Error('This photo is used in “Open House”. Remove it from there first.'), 'x')).toBe('This photo is used in “Open House”. Remove it from there first.')
    expect(explainUploadError({ message: 'In use' }, 'x')).toBe('In use')
    expect(explainUploadError('Refused', 'x')).toBe('Refused')
  })

  it('falls back when there are no words to use', () => {
    expect(explainUploadError(new Error(''), 'Could not remove it.')).toBe('Could not remove it.')
    expect(explainUploadError(undefined, 'Could not remove it.')).toBe('Could not remove it.')
    expect(explainUploadError(null, 'Could not remove it.')).toBe('Could not remove it.')
  })

  it('cuts a long one short', () => {
    expect(explainUploadError(new Error('x'.repeat(1000)), 'f')).toHaveLength(280)
  })
})
