import { useRef } from 'react'
import api from '@/api'
import github from '@/api/github'
import useNotification from '@/common/methods/notification'
import { useFontStore } from '@/common/methods/fonts'
import { readQuery, replaceQuery } from '@/common/hooks/useRouteQuery'
import Button from '@/components/ui/Button'
import { canvasState, widgetState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import type { TdWidgetData } from '@/store/types'

export type TEmitChangeData = {
  downloadPercent: number | null
  downloadText: string
  downloadMsg?: string
  cancelText?: string
}

type Props = {
  isDone?: boolean
  onChange: (data: TEmitChangeData) => void
}

export default function UploadTemplate({ isDone, onChange }: Props) {
  const started = useRef(false)
  if (!started.current) {
    started.current = true
    useFontStore.init()
  }

  const addition = useRef(0)
  const lenCount = useRef(0)
  const lens = useRef(0)
  const queue = useRef<TdWidgetData[]>([])
  const widgets = useRef<TdWidgetData[]>([])
  const page = useRef<Record<string, any>>({})

  async function prepare() {
    setShowMoveable(false)
    const { type } = readQuery()

    if (Number(type) == 1) {
      if (widgetState.dWidgets[0].type === 'w-group') {
        const group = widgetState.dWidgets.shift()
        if (!group) return
        if (!group.record) return
        group.record.width = 0
        group.record.height = 0
        widgetState.dWidgets.push(group)
      }
      if (!widgetState.dWidgets.some((x) => x.type === 'w-group')) {
        alert('Group all layers together before uploading.')
        return
      }
    }

    addition.current = 0
    lenCount.current = 0
    widgets.current = widgetState.dWidgets
    page.current = canvasState.dPage

    if (page.current.backgroundImage) {
      onChange({ downloadPercent: 1, downloadText: 'Getting ready to upload', downloadMsg: 'Please wait…' })
      page.current.backgroundImage = await github.putPic(page.current.backgroundImage.split(',')[1])
    }

    for (const item of widgets.current) {
      if (item.type === 'w-image') {
        lenCount.current += item.imgUrl?.length || 0
        queue.current.push(item)
      }
    }
    lens.current = queue.current.length
    uploadImgs()
  }

  async function uploadImgs() {
    if (queue.current.length > 0) {
      const item = queue.current.pop()
      if (!item) return
      const url = await github.putPic((item?.imgUrl || '').split(',')[1])
      addition.current += item.imgUrl?.length || 0
      let downloadPercent: number | null = (addition.current / lenCount.current) * 100
      downloadPercent >= 100 && (downloadPercent = null)
      onChange({
        downloadPercent,
        downloadText: 'Uploading files',
        downloadMsg: `Done: ${lens.current - queue.current.length} / ${lens.current}`,
      })
      item.imgUrl = url
      uploadImgs()
    } else {
      uploadTemplate()
    }
  }

  async function uploadTemplate() {
    onChange({ downloadPercent: 95, downloadText: 'Making the cover image', downloadMsg: 'Almost done...' })
    const { type } = readQuery()
    const data = Number(type) == 1 ? JSON.stringify(widgets.current) : JSON.stringify({ page: page.current, widgets: widgets.current })
    const { id, stat, msg }: any = await api.home.saveTemp({
      title: 'From your own design',
      type,
      data,
      width: page.current.width,
      height: page.current.height,
    })
    stat !== 0 ? useNotification('Saved', '') : useNotification('Could not save', msg, { type: 'error' })
    replaceQuery({ id: String(id) })
    onChange({ downloadPercent: 99.99, downloadText: 'Upload complete', cancelText: '' })
  }

  return (
    <>
      {isDone ? (
        <Button type="primary" plain onClick={prepare}>
          <b>Upload template</b>
        </Button>
      ) : null}
    </>
  )
}
