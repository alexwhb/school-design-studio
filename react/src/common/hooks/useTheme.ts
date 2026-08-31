import { useSyncExternalStore } from 'react'

export type ThemePreference = 'system' | 'light' | 'dark'

export const THEME_STORAGE_KEY = 'ds_theme'

const media = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null

let target: HTMLElement | null = null
let darkClass = 'dark'

/**
 * Where the theme class goes. Standalone that is <html>; embedded it is the
 * editor's own root, so the host app's appearance is left alone.
 */
export function setThemeTarget(element: HTMLElement, className = 'dark') {
  target = element
  darkClass = className
  paint()
}

/**
 * Hands the theme back. Clears the class off the element the editor was
 * painting and leaves the host document untouched — painting <html> here is
 * how an unmounting embedded editor used to darken the page around it.
 */
export function clearThemeTarget() {
  if (target) {
    target.classList.remove(darkClass)
    target.style.colorScheme = ''
  }
  target = null
  darkClass = 'dark'
}

function themeTarget(): HTMLElement {
  return target ?? document.documentElement
}

function readStored(): ThemePreference {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    return raw === 'light' || raw === 'dark' ? raw : 'system'
  } catch {
    return 'system'
  }
}

let preference: ThemePreference = readStored()
const listeners = new Set<() => void>()

function resolve(): 'light' | 'dark' {
  return preference === 'system' ? (media?.matches ? 'dark' : 'light') : preference
}

let resolvedValue: 'light' | 'dark' = resolve()
let snapshot = { preference, resolved: resolvedValue }

function emit() {
  resolvedValue = resolve()
  snapshot = { preference, resolved: resolvedValue }
  listeners.forEach((l) => l())
}

function paint() {
  const dark = resolve() === 'dark'
  const element = themeTarget()
  element.classList.toggle(darkClass, dark)
  element.style.colorScheme = dark ? 'dark' : 'light'
}

media?.addEventListener('change', () => {
  if (preference === 'system') {
    paint()
    emit()
  }
})

export function setThemePreference(next: ThemePreference, persist = true) {
  preference = next
  if (persist) {
    try {
      next === 'system' ? localStorage.removeItem(THEME_STORAGE_KEY) : localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* see readStored */
    }
  }
  paint()
  emit()
}

/**
 * Paints the theme onto <html>. Only the standalone app calls this — an
 * embedded editor paints its own root instead, and must not touch the page it
 * is a guest on.
 */
export function initStandaloneTheme() {
  paint()
}

export function toggleTheme() {
  setThemePreference(resolve() === 'dark' ? 'light' : 'dark')
}

export function getResolvedTheme() {
  return resolvedValue
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export default function useTheme() {
  const state = useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => snapshot,
  )
  return {
    preference: state.preference,
    resolved: state.resolved,
    setThemePreference,
    toggleTheme,
  }
}
