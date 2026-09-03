/**
 * Switching a colour off without losing which colour it was.
 *
 * A fill that can be turned off has to go somewhere while it is off, and the
 * panel is the wrong place to keep it — the settings panel is one instance
 * handed a different widget rather than rebuilt, so anything it remembers
 * belongs to whatever was selected a moment ago. Putting the alpha to zero
 * leaves the colour on the widget, where it survives selecting something else,
 * saving and reloading; turning the row back on only has to put the alpha back.
 */
const HEX = /^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/

export function isPainted(color?: string) {
  const value = (color || '').trim()
  if (!value || value === 'transparent' || value === 'none') return false
  return !(value.length === 9 && HEX.test(value) && value.slice(7).toLowerCase() === '00')
}

export function withPaint(color: string | undefined, on: boolean) {
  const value = (color || '').trim()
  // A gradient or a picture has no alpha to put out, so it goes as the word
  // and comes back as black — which is what the picker would have opened on
  // anyway, and is at least something to see.
  if (!HEX.test(value)) return on ? (isPainted(value) ? value : '#000000ff') : 'transparent'
  return value.slice(0, 7) + (on ? 'ff' : '00')
}
