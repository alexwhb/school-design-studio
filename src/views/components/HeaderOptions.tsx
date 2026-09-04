import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import api from '@/api'
import _config from '@/config'
import downloadBlob from '@/common/methods/download/downloadBlob'
import { withPageRenderer } from '@/common/methods/export/renderPage'
import { dataUrlToBlob, safeFileName } from '@/common/methods/export/utils'
import useNotification from '@/common/methods/notification'
import { useFontStore } from '@/common/methods/fonts'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { autosaveState, type SaveStatus } from '@/common/hooks/autosave'
import { useHostApi, type DesignDocument } from '@/common/hooks/hostApi'
import { sanitizeFields } from '@/compose/fields'
import { canvasState, userState, widgetState } from '@/store/state'
import type { TdLayout, TdWidgetData } from '@/store/types'
import { setShowMoveable } from '@/store/control'
import { setLayoutsChange } from '@/store/force'
import { managerEdit } from '@/store/base'
import { setDPage, getDPage } from '@/store/canvas'
import { addGroup, addWidget, fillTemplateLayouts, getWidgets, setDWidgets, setTemplate } from '@/store/widget'
import { decodeText } from '@/store/widget/template'
import { brandResolver } from '@/common/methods/brandKit'
import { fillWidget } from '@/utils/mergeFields'
import ThemeToggle from './ThemeToggle'
import './headerOptions.less'

export type HeaderOptionsHandle = {
  getTitle: () => string
  /** Puts a name back in the box — used when a saved design is restored. */
  setTitle: (title: string) => void
  /** Replaces the canvas with a whole document. See `showDocument`. */
  showDocument: (doc: DesignDocument) => void
  download: (scale?: number) => Promise<void>
  save: (hasCover?: boolean) => Promise<void>
  saveTemp: () => Promise<void>
  stateChange: (e: boolean) => Promise<void>
  load: (cb: () => void) => Promise<void>
}

const SAVE_LABEL: Record<Exclude<SaveStatus, 'idle'>, string> = {
  saved: 'Saved',
  unsaved: 'Unsaved changes',
  saving: 'Saving\u2026',
  error: 'Couldn\u2019t save',
}

type Props = {
  /** Saves through the host. Absent when the editor keeps its own design. */
  onHostSave?: () => Promise<void>
  isContinue: boolean
  onContinueChange: (value: boolean) => void
  onChange: (data: { downloadPercent: number; downloadText: string; downloadMsg?: string }) => void
  /** The design's name is part of what autosave keeps, so a rename is a change. */
  onTitleChange?: () => void
  children?: ReactNode
}

const HeaderOptions = forwardRef<HeaderOptionsHandle, Props>(function HeaderOptions({ onHostSave, isContinue, onContinueChange, onChange, onTitleChange, children }, ref) {
  const mode = useEditorMode()
  const host = useHostApi()
  const { tempEditing } = useSnapshot(userState)
  const saveStatus = useSnapshot(autosaveState).status
  const [title, setTitle] = useState('')
  const titleRef = useRef('')
  titleRef.current = title
  const loadingRef = useRef(false)

  /**
   * Renames the design, and says so at once.
   *
   * `setTitle` alone is not enough for anything that reads the name back in the
   * same tick: the ref is written during render, so a caller that renames and
   * then asks for the name gets the old one. That is how the save pill came up
   * reading "Unsaved changes" over a design nobody had touched — the baseline
   * was taken with the name still empty, and the render that filled it in
   * looked like an edit.
   */
  function applyTitle(next: string) {
    titleRef.current = next || ''
    setTitle(next || '')
  }

  // Gallery selection replaces the whole canvas in place, so unlike a deep
  // link it has no load response that would otherwise populate the title.
  useEffect(() => {
    const setTemplateTitle = (event: Event) => {
      const next = (event as CustomEvent<string>).detail
      applyTitle(next)
      onTitleChange?.()
    }
    window.addEventListener('design-title', setTemplateTitle)
    return () => window.removeEventListener('design-title', setTemplateTitle)
  }, [onTitleChange])

  async function save() {
    await saveTemp()
  }

  async function saveTemp() {
    const { tempid, tempType: type } = readQuery()
    if (!tempid) return
    let res: any = null
    const data = widgetState.dLayouts
    if (Number(type) == 1) {
      // Saving an element wants the group last and its recorded size cleared.
      // That is a fact about the payload, not about the canvas, so it happens
      // to a plain copy — reordering the live store moved the element the
      // author had selected out from under them every time they pressed Save.
      const widgets: TdWidgetData[] = JSON.parse(JSON.stringify(widgetState.dWidgets))
      if (widgets[0]?.type === 'w-group') {
        const group = widgets.shift()
        if (!group) return
        // A page carries no `record`, so the type allows it to be missing.
        if (!group.record) return
        group.record.width = 0
        group.record.height = 0
        widgets.push(group)
      }
      if (!widgets.some((x) => x.type === 'w-group')) {
        useNotification('Nothing to save', 'An element must be grouped before you can save it.', { type: 'warning' })
        return
      }
      res = await api.home.saveTemp({
        id: tempid,
        type,
        title: titleRef.current || 'Untitled element',
        data: JSON.stringify(widgets),
        width: canvasState.dPage.width,
        height: canvasState.dPage.height,
      })
    } else {
      res = await api.home.saveTemp({
        id: tempid,
        title: titleRef.current || 'Untitled template',
        data: JSON.stringify(data),
        width: canvasState.dPage.width,
        height: canvasState.dPage.height,
      })
    }
    res?.stat != null && res.stat !== 0 && useNotification('Saved', 'Your template has been updated')
    !tempid && replaceQuery({ tempid: res.id })
  }

  async function stateChange(e: boolean) {
    const { tempid, tempType: type } = readQuery()
    const { stat }: any = await api.home.saveTemp({ id: tempid, type, state: e ? 1 : 0 })
    stat != null && stat !== 0 && useNotification('Saved', 'Your template has been updated')
  }

  /**
   * Exports the current page as a PNG.
   *
   * Everything is drawn in the browser, by the same renderer the PowerPoint
   * export uses. Upstream sent designs containing an SVG shape, a masked image,
   * a QR code or text effects to a Puppeteer screenshot service instead — a
   * backend this fork does not run, so those exports came back as whatever the
   * web server answered `/api/screenshots` with: a 1KB HTML page saved under a
   * .png name.
   */
  async function download(scale = 1) {
    if (loadingRef.current === true) {
      useNotification('Export in progress', 'Another export is already running. Please wait.')
      return
    }
    loadingRef.current = true
    onContinueChange(true)
    onChange({ downloadPercent: 5, downloadText: 'Preparing your design…' })

    try {
      const dataUrl = await withPageRenderer((renderer) => {
        onChange({ downloadPercent: 35, downloadText: 'Drawing the page' })
        return renderer.renderPage(canvasState.dCurrentPage, scale)
      })
      if (!dataUrl) throw new Error('The page could not be drawn.')

      onChange({ downloadPercent: 90, downloadText: 'Saving the image' })
      downloadBlob(dataUrlToBlob(dataUrl), safeFileName(titleRef.current, 'png'))
      onChange({ downloadPercent: 100, downloadText: 'Your design has been downloaded', downloadMsg: '' })
    } catch (e: any) {
      console.error('[export] image export failed', e)
      onChange({ downloadPercent: 0, downloadText: '' })
      useNotification('Could not export', e?.message || 'Sorry, that export did not work. Please try again.', { type: 'error' })
      return
    } finally {
      loadingRef.current = false
    }

    // The file is already on disk, so a failure to save the template must not
    // read as a failed export.
    try {
      await save()
    } catch (e) {
      console.warn('[export] could not save the design after exporting', e)
    }
  }

  async function load(cb: () => void) {
    const { id, tempid: tempId, tempType: type, w_h } = readQuery()
    if (mode !== 'draw') {
      await useFontStore.init()
    }
    // A design the host handed in wins over anything in the URL. The planner
    // opened this editor on a particular artefact; a ?tempid left over from a
    // previous visit is not a reason to show a different one.
    if (host.document) {
      showDocument(host.document)
      cb()
      return
    }
    const apiName = tempId && !id ? 'getTempDetail' : 'getWorks'
    if (w_h && !id && !tempId) {
      const wh: any = w_h.toString().split('*')
      wh[0] && (canvasState.dPage.width = Number(wh[0]))
      wh[1] && (canvasState.dPage.height = Number(wh[1]))
    }
    if (!id && !tempId) {
      initBoard()
      cb()
      return
    }
    let response: any
    try {
      response = await api.home[apiName]({ id: (id || tempId) as any, type: type as any })
    } catch (error) {
      console.warn('[design] could not load the requested design', error)
      initBoard()
      cb()
      return
    }
    const { data: content, title: loadedTitle, state: _state, width, height } = response
    if (!content) {
      initBoard()
      cb()
      return
    }
    let data: any
    try {
      data = JSON.parse(content)
    } catch (error) {
      console.warn('[design] requested design was not valid JSON', error)
      initBoard()
      cb()
      return
    }
    applyTitle(loadedTitle)
    setShowMoveable(false)
    if (Number(type) == 1) {
      canvasState.dPage.width = width
      canvasState.dPage.height = height
      if (Array.isArray(data)) {
        addGroup(data)
      } else {
        data.text && (data.text = decodeText(data.text))
        addWidget(fillWidget(data, brandResolver()))
      }
    } else {
      if (Array.isArray(data)) {
        // A template of several pages arrives whole. A saved design does not
        // get the fill, nor the kit's colours: what it says was settled when
        // it was saved.
        widgetState.dLayouts = id ? data : fillTemplateLayouts(data, response.brand)
        setDWidgets(getWidgets())
      } else {
        widgetState.dLayouts = [{ global: data.page, layers: data.widgets }]
        id ? setDWidgets(getWidgets()) : setTemplate(getWidgets(), response.brand)
      }
      setDPage(getDPage())
    }
    cb()
  }

  /**
   * Puts a whole document on the canvas: the host's, or one it hands in later
   * through the component's ref.
   *
   * The layouts are copied on the way in. What arrives is the host's own
   * object, and the store mutates deeply — writing straight through would edit
   * the host's copy of a design it thinks it is holding unchanged.
   */
  function showDocument(doc: DesignDocument) {
    // Every document reaching the canvas comes through here — the `document`
    // prop and the ref's `setDocument` both — so this is where the fields that
    // are interpolated somewhere get checked. `sanitizeFields` copies, which is
    // also the copy this function needs: the store mutates deeply, and writing
    // straight through would edit the host's own object.
    const { doc: safe, report } = sanitizeFields(doc)
    if (report.dropped.length) console.warn('[design] dropped fields a design may not carry', report.dropped)
    const layouts = Array.isArray(safe?.layouts) && safe.layouts.length ? (safe.layouts as TdLayout[]) : null
    applyTitle(safe?.title || '')
    if (!layouts) {
      initBoard()
      return
    }
    setShowMoveable(false)
    canvasState.dCurrentPage = 0
    widgetState.dLayouts = layouts
    setDWidgets(getWidgets())
    setLayoutsChange()
    setDPage(getDPage())
  }

  function initBoard() {
    setDWidgets(getWidgets())
    setDPage(getDPage())
  }

  useImperativeHandle(
    ref,
    () => ({ getTitle: () => titleRef.current, setTitle: applyTitle, showDocument, download, save, saveTemp, stateChange, load }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mode, host.document],
  )

  return (
    <>
      <div className="top-title">
        <Input
          value={title}
          placeholder="Untitled design"
          wrapperClassName="input-wrap"
          onChange={(next: string) => {
            applyTitle(next)
            onTitleChange?.()
          }}
        />
        {/*
          Autosaving is quiet by design, so this is the only thing that says
          the work is safe. It reads nothing at all until autosave is watching,
          because before that neither answer would be true.
        */}
        {saveStatus !== 'idle' ? <span className="top-title__saved">{SAVE_LABEL[saveStatus]}</span> : null}
      </div>
      <div className="top-icon-wrap">
        {tempEditing ? (
          <>
            <Button plain type="primary" onClick={saveTemp}>
              Save template
            </Button>
            <Button onClick={() => managerEdit(false)}>Cancel</Button>
            <div className="top-nav-divider" />
          </>
        ) : null}
        <ThemeToggle />
        {host.onSave ? (
          <Button className="host-save-btn" type="primary" plain onClick={() => void onHostSave?.()}>
            {host.saveLabel}
          </Button>
        ) : null}
        <div className="top-nav-divider" />
        {children}
      </div>
    </>
  )
})

export default HeaderOptions
