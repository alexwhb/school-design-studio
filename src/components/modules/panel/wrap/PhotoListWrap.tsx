import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@/api'
import type { TGetImageListResult } from '@/api/material'
import setImageData from '@/common/methods/DesignFeatures/setImage'
import useConfirm from '@/common/methods/confirm'
import DragHelper from '@/common/hooks/dragHelper'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import { deleteUpload, listUploads, type LocalUpload } from '@/common/methods/localUploads'
import eventBus from '@/utils/plugins/eventBus'
import Image from '@/components/ui/Image'
import { PlusIcon } from '@/components/ui/icons'
import Uploader, { type TModelData, type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget, setSelectItem } from '@/store/widget'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import { PHOTO_NOTICES } from './components/photoNotices'
import SearchHeader from './components/SearchHeader'
import FilterChips, { NO_CHIP } from './components/FilterChips'
import PanelEyebrow from './components/PanelEyebrow'
import Card, { CardGrid } from './components/Card'
import EditModel from './components/EditModel'
import ImageTip from './components/ImageTip'
import { PanelBody, PanelHead, PanelSectionBlock, PanelWrap } from './components/PanelShell'
import './photoListWrap.less'

type TCategory = {
  id: number
  name: string
}

/**
 * The library has no "everything" shelf — asking for no category answers with
 * the first one — so the chips are the categories themselves and one of them is
 * always in force.
 */
const BROWSE_CATEGORIES: TCategory[] = [
  { id: 1, name: 'School life' },
  { id: 2, name: 'Backgrounds' },
  { id: 3, name: 'Sports' },
]

const dragHelper = new DragHelper()

export default function PhotoListWrap() {
  const [photos, setPhotos] = useState<TGetImageListResult[]>([])
  const [uploads, setUploads] = useState<LocalUpload[]>([])
  const [percent, setPercent] = useState<TModelData>({ num: 0 })
  const [loadDone, setLoadDone] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [cate, setCate] = useState<TCategory>(BROWSE_CATEGORIES[0])
  const [notice, setNotice] = useState('')

  const listRef = useRef<HTMLDivElement | null>(null)
  const loading = useRef(false)
  const page = useRef(0)
  const doneRef = useRef(false)
  const keywordRef = useRef('')
  const cateRef = useRef<TCategory | null>(BROWSE_CATEGORIES[0])
  const photosRef = useRef<TGetImageListResult[]>([])
  photosRef.current = photos
  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })

  const libraryLabel = useMemo(() => (keyword ? `Results for “${keyword}”` : 'Photo library'), [keyword])

  const getDataList = useCallback(async () => {
    if (doneRef.current || loading.current) {
      return
    }
    loading.current = true
    page.current += 1
    const { list = [], error } = await api.material.getImagesList({
      cate: cateRef.current?.id,
      keyword: keywordRef.current || undefined,
      page: page.current,
      pageSize: 30,
    })
    if (error) {
      setNotice(PHOTO_NOTICES[error])
      doneRef.current = true
      setLoadDone(true)
    } else if (list.length <= 0) {
      doneRef.current = true
      setLoadDone(true)
      if (photosRef.current.length <= 0) {
        setNotice(keywordRef.current ? `No photos match “${keywordRef.current}”. Try a broader word.` : 'No photos here yet.')
      }
    } else {
      setPhotos((prev) => prev.concat(list))
    }
    setTimeout(() => {
      loading.current = false
    }, 100)
  }, [])

  useInfiniteScroll(listRef, getDataList)

  const started = useRef(false)
  if (!started.current) {
    started.current = true
    getDataList()
  }

  /** The visitor's own uploads, which live in this browser and nowhere else. */
  const loadUploads = useCallback(() => {
    listUploads()
      .then(setUploads)
      .catch(() => setUploads([]))
  }, [])

  useEffect(() => {
    loadUploads()
    eventBus.on('refreshUserImages', loadUploads)
    return () => {
      eventBus.off('refreshUserImages', loadUploads)
    }
  }, [loadUploads])

  const resetList = () => {
    page.current = 0
    doneRef.current = false
    setLoadDone(false)
    setPhotos([])
    photosRef.current = []
    setNotice('')
    if (listRef.current) listRef.current.scrollTop = 0
  }

  const searchChange = (next: string) => {
    const trimmed = next.trim()
    if (trimmed === keywordRef.current) {
      return
    }
    keywordRef.current = trimmed
    setKeyword(trimmed)
    resetList()
    getDataList()
  }

  const cateChange = (item: TCategory) => {
    keywordRef.current = ''
    setKeyword('')
    cateRef.current = item
    setCate(item)
    resetList()
    getDataList()
  }

  const placeImage = async (item: { url?: string; width?: number; height?: number; downloadLocation?: string }) => {
    setShowMoveable(false)
    const setting = JSON.parse(JSON.stringify(wImageSetting))
    const img = await setImageData(item as any)
    setting.width = img.width
    setting.height = img.height
    setting.imgUrl = item.url
    const { width: pW, height: pH } = canvasState.dPage
    setting.left = pW / 2 - img.width / 2
    setting.top = pH / 2 - img.height / 2
    addWidget(setting)
    api.material.trackImageUse(item.downloadLocation)
  }

  /**
   * A press on a thumbnail arms the drag: the helper paints the ghost that
   * follows the pointer, and the store is told what will land if it is let go
   * over the page.
   */
  const dragStart = async (e: React.MouseEvent, item: { url?: string; thumb?: string; width: number; height: number; downloadLocation?: string }) => {
    e.preventDefault()
    const img = await setImageData({ width: item.width, height: item.height, url: item.thumb || item.url || '' })
    dragHelper.start(e.nativeEvent, img.canvasWidth)
    setSelectItem({ data: { value: item }, type: 'image' })
    api.material.trackImageUse(item.downloadLocation)
  }

  const mousemove = (e: React.MouseEvent) => {
    e.preventDefault()
    // startPoint only holds a real position between mousedown and mouseup. Without
    // this the move that carries the pointer onto a thumbnail is measured against
    // the sentinel, reads as a drag of ninety-nine thousand pixels, and the click
    // that follows is thrown away as the end of one.
    if (startPoint.current.x === 99999) return
    if (Math.abs(e.clientX - startPoint.current.x) > 2 || Math.abs(e.clientY - startPoint.current.y) > 2) {
      isDrag.current = true
    }
  }

  const mouseup = (e: React.MouseEvent) => {
    e.preventDefault()
    setTimeout(() => {
      isDrag.current = false
      startPoint.current = { x: 99999, y: 99999 }
    }, 10)
  }

  /** The three handlers every thumbnail needs, uploaded or from the library. */
  const thumbProps = (item: any) => ({
    draggable: false as const,
    onMouseDown: (e: React.MouseEvent) => {
      startPoint.current = { x: e.clientX, y: e.clientY }
      dragStart(e, item)
    },
    onMouseMove: mousemove,
    onMouseUp: mouseup,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      !isDrag.current && placeImage(item)
    },
  })

  const uploadDone = (res: TUploadDoneData) => {
    setUploads((prev) => [res as unknown as LocalUpload, ...prev])
  }

  const deleteUploadItem = async ({ item }: { item: LocalUpload }) => {
    setShowMoveable(false)
    const isPass = await useConfirm('Remove this upload?', 'It will disappear from anything on the page that uses it.', 'warning')
    if (!isPass) {
      return
    }
    await deleteUpload(String(item.id))
    // The record is gone from IndexedDB for good, so the tile goes with it —
    // there is nothing left for a greyed-out "Deleted" tile to stand for.
    setUploads((prev) => prev.filter((entry) => String(entry.id) !== String(item.id)))
  }

  return (
    <PanelWrap className="photo-list-wrap">
      <PanelHead>
        <SearchHeader value={keyword} placeholder="Search photos" onChange={setKeyword} onSearch={searchChange} />
        <FilterChips items={BROWSE_CATEGORIES} value={keyword ? NO_CHIP : cate.id} onChange={cateChange} />
      </PanelHead>

      <PanelBody ref={listRef}>
        <PanelSectionBlock className="photo-list-wrap__uploads">
          <PanelEyebrow label="My uploads" note="only you" />
          <CardGrid columns={3}>
            <Uploader value={percent} className="upload-tile" onChange={setPercent} onDone={uploadDone}>
              <PlusIcon width={16} height={16} />
              <span>Upload</span>
            </Uploader>
            {uploads.map((item) => (
              <Card
                key={item.id}
                ratio="1"
                title={item.title}
                {...thumbProps(item)}
              >
                <EditModel options={[{ name: 'Delete', fn: deleteUploadItem }] as any} data={{ item }}>
                  <Image className="list__img transparent-bg" src={item.url} fit="cover" lazy />
                </EditModel>
              </Card>
            ))}
          </CardGrid>
        </PanelSectionBlock>

        <PanelSectionBlock>
          <PanelEyebrow label={libraryLabel} note={keyword ? undefined : cate.name} />
          {notice ? <p className="panel-wrap__note">{notice}</p> : null}
          <CardGrid columns={2} className="photo-list-wrap__library">
            {photos.map((item, i) => (
              <Card
                key={String(item.id) + i}
                meta={item.author}
                {...thumbProps(item)}
              >
                <ImageTip detail={item as any}>
                  <Image
                    className="list__img"
                    src={item.thumb || item.url}
                    fit="cover"
                    lazy
                    placeholder={<div style={{ backgroundColor: item.color }} className="image-color" />}
                  />
                </ImageTip>
              </Card>
            ))}
          </CardGrid>
          {loadDone && photos.length ? <div className="panel-wrap__status">That is everything</div> : null}
        </PanelSectionBlock>
      </PanelBody>
    </PanelWrap>
  )
}
