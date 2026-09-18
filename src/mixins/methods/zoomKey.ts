/**
 * Ctrl/Cmd with plus, minus or zero, the way every editor does it.
 *
 * Read off `e.key` rather than a key code, because the codes disagree: the
 * `=` key is 187 in Chrome and 61 in Firefox, the numeric keypad is 107 and
 * 109 again, and a layout where `+` needs Shift moves all of them. `e.key` is
 * the character, so it covers the lot. The codes stay as a fallback for a
 * synthetic event that carries no key.
 */
export default function zoomKey(e: KeyboardEvent): 'in' | 'out' | 'fit' | null {
  switch (e.key) {
    case '+':
    case '=':
      return 'in'
    case '-':
    case '_':
      return 'out'
    case '0':
      return 'fit'
  }
  if (e.keyCode === 187 || e.keyCode === 61 || e.keyCode === 107) return 'in'
  if (e.keyCode === 189 || e.keyCode === 173 || e.keyCode === 109) return 'out'
  if (e.keyCode === 48 || e.keyCode === 96) return 'fit'
  return null
}
