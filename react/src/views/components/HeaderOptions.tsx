import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
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
import { canvasState, userState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { managerEdit } from '@/store/base'
import { setDPage, getDPage } from '@/store/canvas'
import { addGroup, addWidget, getWidgets, setDWidgets, setTemplate } from '@/store/widget'
import WatermarkToggle from './WatermarkToggle'
import ThemeToggle from './ThemeToggle'
import './headerOptions.less'

export type HeaderOptionsHandle = {
  getTitle: () => string
  /** Puts a name back in the box — used when a saved design is restored. */
  setTitle: (title: string) => void
  download: (scale?: number) => Promise<void>
  save: (hasCover?: boolean) => Promise<void>
  saveTemp: () => Promise<void>
  stateChange: (e: boolean) => Promise<void>
  load: (cb: () => void) => Promise<void>
}

type Props = {
  isContinue: boolean
  onContinueChange: (value: boolean) => void
  onChange: (data: { downloadPercent: number; downloadText: string; downloadMsg?: string }) => void
  /** The design's name is part of what autosave keeps, so a rename is a change. */
  onTitleChange?: () => void
  children?: ReactNode
}

const HeaderOptions = forwardRef<HeaderOptionsHandle, Props>(function HeaderOptions(
  { isContinue, onContinueChange, onChange, onTitleChange, children },
  ref,
) {
  const mode = useEditorMode()
  const { tempEditing } = useSnapshot(userState)
  const [title, setTitle] = useState('')
  const titleRef = useRef('')
  titleRef.current = title
  const loadingRef = useRef(false)

  async function save() {
    await saveTemp()
  }

  async function saveTemp() {
    const { tempid, tempType: type } = readQuery()
    if (!tempid) return
    let res: any = null
    const data = widgetState.dLayouts
    if (Number(type) == 1) {
      if (widgetState.dWidgets[0].type === 'w-group') {
        const group = widgetState.dWidgets.shift()
        if (!group) return
        // A page carries no `record`, so the type allows it to be missing.
        if (!group.record) return
        group.record.width = 0
        group.record.height = 0
        widgetState.dWidgets.push(group)
      }
      if (!widgetState.dWidgets.some((x) => x.type === 'w-group')) {
        alert('An element must be grouped before you can save it.')
        return
      }
      res = await api.home.saveTemp({
        id: tempid,
        type,
        title: titleRef.current || 'Untitled element',
        data: JSON.stringify(widgetState.dWidgets),
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
    res.stat != 0 && useNotification('Saved', 'Your template has been updated')
    !tempid && replaceQuery({ tempid: res.id })
  }

  async function stateChange(e: boolean) {
    const { tempid, tempType: type } = readQuery()
    const { stat }: any = await api.home.saveTemp({ id: tempid, type, state: e ? 1 : 0 })
    stat != 0 && useNotification('Saved', 'Your template has been updated')
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
    const {
      data: content,
      title: loadedTitle,
      state: _state,
      width,
      height,
    } = await api.home[apiName]({ id: (id || tempId) as any, type: type as any })
    if (!content) return
    const data = JSON.parse(content)
    setTitle(loadedTitle)
    setShowMoveable(false)
    if (Number(type) == 1) {
      canvasState.dPage.width = width
      canvasState.dPage.height = height
      if (Array.isArray(data)) {
        addGroup(data)
      } else {
        data.text && (data.text = decodeURIComponent(data.text))
        addWidget(data)
      }
    } else {
      if (Array.isArray(data)) {
        widgetState.dLayouts = data
        setDWidgets(getWidgets())
      } else {
        widgetState.dLayouts = [{ global: data.page, layers: data.widgets }]
        id ? setDWidgets(getWidgets()) : setTemplate(getWidgets())
      }
      setDPage(getDPage())
    }
    cb()
  }

  function initBoard() {
    setDWidgets(getWidgets())
    setDPage(getDPage())
  }

  function jump2Edit() {
    managerEdit(true)
  }

  useImperativeHandle(
    ref,
    () => ({ getTitle: () => titleRef.current, setTitle: (next: string) => setTitle(next || ''), download, save, saveTemp, stateChange, load }),
    [mode],
  )

  return (
    <>
      <div className="top-title">
        <Input
          value={title}
          placeholder="Untitled design"
          wrapperClassName="input-wrap"
          onChange={(next: string) => {
            setTitle(next)
            onTitleChange?.()
          }}
        />
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
        ) : (
          <Button text onClick={jump2Edit}>
            Edit template
          </Button>
        )}
        <WatermarkToggle />
        <ThemeToggle />
        <div className="top-nav-divider" />
        {children}
      </div>
    </>
  )
})

export default HeaderOptions
