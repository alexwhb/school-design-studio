/**
 * Light / dark appearance.
 *
 * Everything visual comes from the custom properties in assets/styles/theme.less,
 * so switching is one class on <html> — no component re-render, no rebuild.
 *
 * Three settings, not two: "system" follows the OS and keeps following it, which
 * is what someone who has never opened this menu expects. Choosing light or dark
 * explicitly pins it and stops listening.
 *
 * The class is applied by an inline script in index.html before the first paint;
 * this module has to agree with it exactly, or the page flashes the other theme.
 */
import { ref, computed, readonly } from 'vue'

export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ds_theme'

const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : 'system'
  } catch {
    // Private browsing, or storage disabled by policy on a school-managed
    // machine. Not being able to remember the choice is not a reason to fail.
    return 'system'
  }
}

const preference = ref<ThemePreference>(readStored())

/** What is actually on screen, once "system" has been resolved. */
const resolved = computed<'light' | 'dark'>(() => (preference.value === 'system' ? (media?.matches ? 'dark' : 'light') : preference.value))

function paint() {
  const dark = resolved.value === 'dark'
  document.documentElement.classList.toggle('dark', dark)
  // Element Plus keys its dark palette off this too, and it is what makes the
  // browser draw native scrollbars and form controls in the right shade.
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
}

media?.addEventListener('change', () => {
  if (preference.value === 'system') paint()
})

export function setThemePreference(next: ThemePreference) {
  preference.value = next
  try {
    // "system" is the absence of a choice, so it is stored as one.
    next === 'system' ? localStorage.removeItem(THEME_STORAGE_KEY) : localStorage.setItem(THEME_STORAGE_KEY, next)
  } catch {
    /* see readStored */
  }
  paint()
}

/** Flips between light and dark, leaving "system" behind. */
export function toggleTheme() {
  setThemePreference(resolved.value === 'dark' ? 'light' : 'dark')
}

export default function useTheme() {
  return {
    preference: readonly(preference),
    resolved,
    setThemePreference,
    toggleTheme,
  }
}

paint()
