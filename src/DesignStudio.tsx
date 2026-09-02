import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { EditorModeContext, type EditorMode } from '@/common/hooks/useEditorMode'
import { setAppRoot } from '@/common/hooks/appRoot'
import { clearThemeTarget, setThemePreference, setThemeTarget, type ThemePreference } from '@/common/hooks/useTheme'
import { adoptBrandKit, loadBrandKit, type TBrandKit } from '@/common/methods/brandKit'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { configure, type DesignStudioConfig } from '@/config'
import Draw from '@/views/Draw'
import Html from '@/views/Html'
import Index from '@/views/Index'
import './assets/styles/embed'

export type DesignStudioProps = {
  /** Which of the editor's screens to show. Defaults to the full editor. */
  mode?: EditorMode
  /**
   * Where the editor's read-only content endpoints live. Leave empty when the
   * host answers `/design/*` on its own origin.
   */
  apiUrl?: string
  /** Where the app name in the toolbar links back to. */
  homeUrl?: string
  /** Name shown in the toolbar. */
  appName?: string
  /** Anything else from the editor's config that the host wants to override. */
  config?: DesignStudioConfig
  /**
   * Appearance. `host` follows whatever the surrounding app has set on <html>,
   * which is what you want when the planner already has a theme switcher.
   */
  theme?: 'light' | 'dark' | 'host'
  /**
   * The school's brand kit, when the host keeps it. Given, it is used as it is
   * and the browser's own copy is left alone; every change made in the Brand
   * panel is then reported through `onBrandChange`, and it is the host's job
   * to store it. Left out, the kit lives in the browser's IndexedDB.
   */
  brand?: TBrandKit
  onBrandChange?: (kit: TBrandKit) => void
  className?: string
  style?: React.CSSProperties
}

function hostPrefersDark() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

export default function DesignStudio({
  mode = 'home',
  apiUrl,
  homeUrl,
  appName,
  config,
  theme = 'host',
  brand,
  onBrandChange,
  className,
  style,
}: DesignStudioProps) {
  const Screen = mode === 'draw' ? Draw : mode === 'html' ? Html : Index
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const brandChange = useRef(onBrandChange)
  brandChange.current = onBrandChange
  const initialBrand = useRef(brand)

  useLayoutEffect(() => {
    configure({
      ...(apiUrl !== undefined ? { API_URL: apiUrl } : null),
      ...(homeUrl !== undefined ? { HOME_URL: homeUrl } : null),
      ...(appName !== undefined ? { APP_NAME: appName } : null),
      ...config,
    })
  }, [apiUrl, homeUrl, appName, config])

  useLayoutEffect(() => {
    const element = rootRef.current
    if (!element) return
    setAppRoot(element)
    setThemeTarget(element, 'ds-dark')
    // The kit is read before the first screen mounts, so a template opened by
    // id is filled in from it rather than from the samples. It is one small
    // row, and a browser that will not open the database gets an empty kit.
    let cancelled = false
    void loadBrandKit(initialBrand.current, (kit) => brandChange.current?.(kit)).finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
      setAppRoot(null)
      clearThemeTarget()
    }
  }, [])

  // A host that changes the kit after mounting — another school chosen in the
  // planner — is followed. Keyed on the kit's contents, not the prop's
  // identity, since a prop built inline is a new object on every render.
  const brandKey = brand ? JSON.stringify(brand) : ''
  useEffect(() => {
    if (ready && brand) adoptBrandKit(brand)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, brandKey])

  useEffect(() => {
    if (!ready) return
    const preference: ThemePreference = theme === 'host' ? (hostPrefersDark() ? 'dark' : 'light') : theme
    setThemePreference(preference, theme !== 'host')
  }, [theme, ready])

  useEffect(() => {
    if (theme !== 'host' || typeof MutationObserver === 'undefined') return
    const observer = new MutationObserver(() => {
      setThemePreference(hostPrefersDark() ? 'dark' : 'light', false)
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [theme])

  useEffect(() => {
    if ((window as any).Snap) return
    const script = document.createElement('script')
    script.src = '/snap.svg-min.js'
    script.async = true
    document.head.appendChild(script)
  }, [])

  return (
    <div ref={rootRef} className={className ? `ds-root ${className}` : 'ds-root'} style={style}>
      {ready ? (
        <EditorModeContext.Provider value={mode}>
          <TooltipProvider>
            <Screen />
          </TooltipProvider>
        </EditorModeContext.Provider>
      ) : null}
    </div>
  )
}
