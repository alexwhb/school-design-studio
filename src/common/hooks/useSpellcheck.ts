/**
 * Whether the browser checks spelling as you type on the canvas.
 *
 * On by default. Upstream hardcoded `spellcheck="false"` on every text widget,
 * which suits a designer setting type and does not suit the person this fork is
 * for: a teacher writing the words on a poster that goes home to four hundred
 * families. Getting the red underline back is worth more than a tidy canvas.
 *
 * Off is a real choice though, not a mistake, which is why this is a preference
 * and not just a change of default. A page of pupil names, a school motto in
 * Latin, or anything in a language the browser has no dictionary for turns the
 * whole design red and the underlines stop meaning anything.
 *
 * The same shape as useTheme: one module-level ref, the choice in localStorage,
 * and the absence of a stored value meaning the default.
 */
import { readonly, ref } from 'vue'

export const SPELLCHECK_STORAGE_KEY = 'ds_spellcheck'

function readStored(): boolean {
  try {
    // Only ever written when someone turns it off, so anything else is on.
    return localStorage.getItem(SPELLCHECK_STORAGE_KEY) !== 'off'
  } catch {
    // Private browsing, or storage disabled by policy on a school-managed
    // machine. Not being able to remember the choice is not a reason to fail.
    return true
  }
}

const enabled = ref<boolean>(readStored())

export function setSpellcheck(next: boolean) {
  enabled.value = next
  try {
    next ? localStorage.removeItem(SPELLCHECK_STORAGE_KEY) : localStorage.setItem(SPELLCHECK_STORAGE_KEY, 'off')
  } catch {
    /* see readStored */
  }
}

export function toggleSpellcheck() {
  setSpellcheck(!enabled.value)
}

export default function useSpellcheck() {
  return {
    enabled: readonly(enabled),
    setSpellcheck,
    toggleSpellcheck,
  }
}
