import { forwardRef, useImperativeHandle, useRef, useState, type ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import api from '@/api'
import _config from '@/config'
import _dl from '@/common/methods/download'
import downloadBlob from '@/common/methods/download/downloadBlob'
import useNotification from '@/common/methods/notification'
import { useFontStore } from '@/common/methods/fonts'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import CreateCover, { type CreateCoverHandle } from '@/components/business/save-download/CreateCover'
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
  download: () => Promise<void>
  save: (hasCover?: boolean) => Promise<void>
  saveTemp: () => Promise<void>
  stateChange: (e: boolean) => Promise<void>
  load: (cb: () => void) => Promise<void>
}

type Props = {
  isContinue: boolean
  onContinueChange: (value: boolean) => void
  onChange: (data: { downloadPercent: number; downloadText: string; downloadMsg?: string }) => void
  children?: ReactNode
}

const HeaderOptions = forwardRef<HeaderOptionsHandle, Props>(function HeaderOptions(
  { isContinue, onContinueChange, onChange, children },
  ref,
) {
  const mode = useEditorMode()
  const { tempEditing } = useSnapshot(userState)
  const [title, setTitle] = useState('')
  const titleRef = useRef('')
  titleRef.current = title
  const loadingRef = useRef(false)
  const continueRef = useRef(isContinue)
  continueRef.current = isContinue
  const canvasImage = useRef<CreateCoverHandle | null>(null)

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

  async function download() {
    if (loadingRef.current === true) {
      useNotification('Export in progress', 'Another export is already running. Please wait.')
      return
    }
    loadingRef.current = true
    onContinueChange(true)
    onChange({ downloadPercent: 1, downloadText: 'Saving…' })
    const currentRecord = canvasState.dCurrentPage
    const backEndCapture: boolean = checkDownloadPoster(widgetState.dLayouts[currentRecord])
    const fileName = `${titleRef.current || 'Untitled design'}.png`
    if (!backEndCapture) {
      const result = await canvasImage.current?.createPoster()
      result?.blob && downloadBlob(result.blob, fileName)
      onChange({ downloadPercent: 100, downloadText: 'Your design has been downloaded' })
      loadingRef.current = false
    }
    await save()
    const { id, tempid } = readQuery()
    if (!id && !tempid) {
      onChange({ downloadPercent: 0, downloadText: 'Please wait…' })
      useNotification('Could not save', 'Pick a template first, then try again.', { type: 'error' })
      loadingRef.current = false
      return
    }
    if (backEndCapture) {
      const { width, height } = canvasState.dPage
      onContinueChange(true)
      onChange({ downloadPercent: 1, downloadText: 'Preparing your design...' })
      let timerCount = 0
      const animation = setInterval(() => {
        if (continueRef.current && timerCount < 75) {
          timerCount += RandomNumber(1, 10)
          onChange({ downloadPercent: 1 + timerCount, downloadText: 'Building the image' })
        } else {
          clearInterval(animation)
        }
      }, 800)
      await _dl.downloadImg(
        api.home.download({ id, tempid, width, height, index: canvasState.dCurrentPage }) + '&r=' + Math.random(),
        (progress: number, xhr: any) => {
          if (continueRef.current) {
            clearInterval(animation)
            progress >= timerCount && onChange({ downloadPercent: Number(progress.toFixed(0)), downloadText: 'Generating the image' })
          } else {
            xhr.abort()
            loadingRef.current = false
          }
        },
        fileName,
      )
      onChange({ downloadPercent: 100, downloadText: 'Your design has been downloaded', downloadMsg: '' })
      loadingRef.current = false
    }
  }

  function RandomNumber(min: number, max: number) {
    return Math.ceil(Math.random() * (max - min)) + min
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

  function checkDownloadPoster({ layers }: any) {
    let backEndCapture = false
    for (let i = 0; i < layers.length; i++) {
      const { type, mask, textEffects } = layers[i]
      if ((type === 'w-image' && mask) || type === 'w-svg' || type === 'w-qrcode' || (textEffects && textEffects.length > 0)) {
        backEndCapture = true
        break
      }
    }
    return backEndCapture
  }

  useImperativeHandle(ref, () => ({ getTitle: () => titleRef.current, download, save, saveTemp, stateChange, load }), [mode])

  return (
    <>
      <div className="top-title">
        <Input value={title} placeholder="Untitled design" wrapperClassName="input-wrap" onChange={setTitle} />
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
      <CreateCover ref={canvasImage} />
    </>
  )
})

export default HeaderOptions
