import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import api from '@/api'
import type { TGetImageListResult } from '@/api/material'
import { listUploads } from '@/common/methods/localUploads'
import Dialog from '@/components/ui/Dialog'
import Tabs from '@/components/ui/Tabs'
import { setShowMoveable } from '@/store/control'
import PhotoList from '@/components/modules/panel/wrap/components/PhotoList'
import './pictureSelector.less'

export type PictureSelectorHandle = {
  open: () => void
}

type Props = {
  onSelect?: (item: TGetImageListResult) => void
}

const PictureSelector = forwardRef<PictureSelectorHandle, Props>(function PictureSelector({ onSelect }, ref) {
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState('uploads')
  const [imgList, setImgList] = useState<TGetImageListResult[]>([])
  const [recommendImgList, setRecommendImgList] = useState<TGetImageListResult[]>([])
  const [isDone, setIsDone] = useState(false)
  const [isPicsDone, setIsPicsDone] = useState(false)

  const loading = useRef(false)
  const picPage = useRef(0)
  const doneRef = useRef(false)
  const picsDoneRef = useRef(false)
  const listRef = useRef<TGetImageListResult[]>([])
  listRef.current = imgList
  const recommendRef = useRef<TGetImageListResult[]>([])
  recommendRef.current = recommendImgList

  const load = useCallback(async (init?: boolean) => {
    if (init) {
      setImgList([])
      doneRef.current = false
      setIsDone(false)
    }
    if (doneRef.current || loading.current) {
      return
    }
    loading.current = true
    const list = (await listUploads().catch(() => [])) as unknown as TGetImageListResult[]
    setImgList(list)
    doneRef.current = true
    setIsDone(true)
    loading.current = false
  }, [])

  const loadPic = useCallback((init?: boolean) => {
    if (picsDoneRef.current || loading.current) {
      return
    }
    if (init && recommendRef.current.length > 0) {
      return
    }
    loading.current = true
    picPage.current += 1
    api.material.getImagesList({ page: picPage.current }).then(({ list }) => {
      if (list.length <= 0) {
        picsDoneRef.current = true
        setIsPicsDone(true)
      } else {
        setRecommendImgList((prev) => prev.concat(list))
      }
      setTimeout(() => {
        loading.current = false
      }, 100)
    })
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setVisible(true)
        load()
        setShowMoveable(false)
      },
    }),
    [load],
  )

  function onOpenChange(next: boolean) {
    setVisible(next)
    if (!next) setShowMoveable(true)
  }

  const selectImg = (index: number, list?: TGetImageListResult[]) => {
    const item = list ? list[index] : listRef.current[index]
    onSelect?.(item)
    setVisible(false)
  }

  function tabChange(name: string) {
    setTab(name)
    if (name === 'library') loadPic(true)
  }

  return (
    <Dialog open={visible} onOpenChange={onOpenChange} title="Choose an image" className="picture-selector">
      <Tabs
        className="demo-tabs"
        stretch={false}
        value={tab}
        onChange={tabChange}
        items={[
          { name: 'uploads', label: 'My uploads' },
          { name: 'library', label: 'Photo library' },
        ]}
      >
        <div style={{ display: tab === 'uploads' ? undefined : 'none' }}>
          <div className="pic__box">
            <PhotoList canDrag={false} isDone={isDone} listData={imgList as any} onLoad={() => load()} onSelect={(i) => selectImg(i)} />
          </div>
        </div>
        <div style={{ display: tab === 'library' ? undefined : 'none' }}>
          <div className="pic__box">
            <PhotoList canDrag={false} isDone={isPicsDone} listData={recommendImgList as any} onLoad={() => loadPic()} onSelect={(i) => selectImg(i, recommendRef.current)} />
          </div>
        </div>
      </Tabs>
    </Dialog>
  )
})

export default PictureSelector
