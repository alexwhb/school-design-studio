import { useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { EditorModeContext, type EditorMode } from '@/common/hooks/useEditorMode'
import { setAppRoot } from '@/common/hooks/appRoot'
import { HostApiContext, type DesignStudioHandle, type HostApi, type HostUploads } from '@/common/hooks/hostApi'
import { clearThemeTarget, setThemePreference, setThemeTarget, type ThemePreference } from '@/common/hooks/useTheme'
import { adoptBrandKit, loadBrandKit, type TBrandKit } from '@/common/methods/brandKit'
import { setHostUploads } from '@/common/methods/localUploads'
import { TooltipProvider } from '@/components/ui/Tooltip'
import { configure, type DesignStudioConfig } from '@/config'
import { setDocumentKind } from '@/store/documentKind'
import type { DesignDocument, DesignKind } from '@/compose/types'
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
  /**
   * The design to edit, when the host keeps it.
   *
   * Given, the editor stops keeping designs of its own: nothing is written to
   * IndexedDB, the "pick up where you left off?" offer never appears, and this
   * document is where undo stops going back. Changes come out through
   * `onDocumentChange` and `onSave`. Changing the prop later is *not* followed
   * — a design is not a setting, and swapping it out from under somebody
   * mid-sentence would lose what they were typing. Use the ref's `setDocument`,
   * which is an explicit act.
   */
  document?: DesignDocument
  /**
   * What is being made. Sets the page size a blank design starts at, narrows
   * the template gallery to templates of that sort, and takes the presenter and
   * the speaker notes away from a poster, which nobody stands up and presents.
   */
  documentKind?: DesignKind
  /**
   * Called after a second of quiet with the whole document, so a host can keep
   * a draft without a save. `dirty` says whether it differs from the last
   * successful save.
   */
  onDocumentChange?: (doc: DesignDocument, meta: { dirty: boolean }) => void
  /**
   * Puts a Save in the toolbar, and answers Cmd/Ctrl-S. The pill beside the
   * design's name follows the promise: Saving…, then Saved, or Couldn't save.
   * After a save that resolved, `isDirty()` is false.
   */
  onSave?: (doc: DesignDocument) => Promise<void>
  /** What that button says. */
  saveLabel?: string
  /**
   * The host's own file store, for the Uploads section of the Photos panel.
   * Given, the browser's own store is neither read nor written.
   */
  uploads?: HostUploads
  /**
   * A panel of the host's own, shown behind an "AI" tab at the top of the left
   * rail. The studio renders it at panel width and passes it nothing: whatever
   * it wants to do to the design it does through `ref`.
   */
  assistant?: ReactNode
  /** Drives the editor from outside. See `DesignStudioHandle`. */
  ref?: React.Ref<DesignStudioHandle>
  className?: string
  style?: React.CSSProperties
}

function hostPrefersDark() {
  if (typeof document === 'undefined') return false
  return document.documentElement.classList.contains('dark')
}

/** Says what went wrong rather than throwing on `null`, which says nothing. */
function notReady(): never {
  throw new Error('The Design Studio editor is not on screen yet. Wait for it to mount before driving it.')
}

export default function DesignStudio({ mode = 'home', apiUrl, homeUrl, appName, config, theme = 'host', brand, onBrandChange, document: hostDocument, documentKind, onDocumentChange, onSave, saveLabel = 'Save', uploads, assistant, ref, className, style }: DesignStudioProps) {
  const Screen = mode === 'draw' ? Draw : mode === 'html' ? Html : Index
  const rootRef = useRef<HTMLDivElement | null>(null)
  const [ready, setReady] = useState(false)
  const brandChange = useRef(onBrandChange)
  brandChange.current = onBrandChange
  const initialBrand = useRef(brand)
  // Read once. The screen loads the document as it mounts, and a host that
  // rebuilds the prop on every render would otherwise reload it each time.
  const initialDocument = useRef(hostDocument ?? null)
  const handleRef = useRef<DesignStudioHandle | null>(null)

  // Kept in refs so that a host passing an inline arrow function — which is
  // every host — does not rebuild the context and re-render the whole editor
  // on each of its own renders.
  const callbacks = useRef({ onSave, onDocumentChange })
  callbacks.current = { onSave, onDocumentChange }

  useLayoutEffect(() => {
    configure({
      ...(apiUrl !== undefined ? { API_URL: apiUrl } : null),
      ...(homeUrl !== undefined ? { HOME_URL: homeUrl } : null),
      ...(appName !== undefined ? { APP_NAME: appName } : null),
      ...config,
    })
  }, [apiUrl, homeUrl, appName, config])

  // Before the first screen mounts: the page a blank design starts on depends
  // on it, and that page is built as the store is first read.
  useLayoutEffect(() => {
    setDocumentKind(documentKind ?? null)
  }, [documentKind])

  useLayoutEffect(() => {
    setHostUploads(uploads ?? null)
    return () => setHostUploads(null)
  }, [uploads])

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

  const hostApi = useMemo<HostApi>(
    () => ({
      document: initialDocument.current,
      documentKind: documentKind ?? 'slides',
      hostsDocument: initialDocument.current !== null,
      saveLabel,
      onSave: onSave ? (doc) => (callbacks.current.onSave as (d: DesignDocument) => Promise<void>)(doc) : null,
      onDocumentChange: onDocumentChange ? (doc, meta) => callbacks.current.onDocumentChange?.(doc, meta) : null,
      assistant: assistant ?? null,
      handleRef,
    }),
    // Whether a callback was given matters; which function it is does not, and
    // is read through `callbacks` at the moment of the call.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [documentKind, saveLabel, !!onSave, !!onDocumentChange, assistant],
  )

  // Forwarded rather than held: the editor screen fills `handleRef` in as it
  // mounts, and a host holding the ref from its first render has to be able to
  // call it later without re-reading it.
  useImperativeHandle(
    ref,
    (): DesignStudioHandle => ({
      getDocument: () => (handleRef.current ?? notReady()).getDocument(),
      setDocument: (doc, opts) => (handleRef.current ?? notReady()).setDocument(doc, opts),
      applyOps: (ops) => (handleRef.current ?? notReady()).applyOps(ops),
      exportPdf: () => (handleRef.current ?? notReady()).exportPdf(),
      exportPptx: () => (handleRef.current ?? notReady()).exportPptx(),
      exportPng: (index, opts) => (handleRef.current ?? notReady()).exportPng(index, opts),
      goToPage: (index) => (handleRef.current ?? notReady()).goToPage(index),
      isDirty: () => handleRef.current?.isDirty() ?? false,
    }),
    [],
  )

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
        <HostApiContext.Provider value={hostApi}>
          <EditorModeContext.Provider value={mode}>
            <TooltipProvider>
              <Screen />
            </TooltipProvider>
          </EditorModeContext.Provider>
        </HostApiContext.Provider>
      ) : null}
    </div>
  )
}
