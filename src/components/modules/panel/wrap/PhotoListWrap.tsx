import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import api from '@/api'
import type { TGetImageListResult } from '@/api/material'
import setImageData from '@/common/methods/DesignFeatures/setImage'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget, setSelectItem } from '@/store/widget'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import { PHOTO_NOTICES } from './components/photoNotices'
import SearchHeader from './components/SearchHeader'
import ClassHeader from './components/ClassHeader'
import PhotoList from './components/PhotoList'
import './photoListWrap.less'

type TCurrentCategory = {
  name: string
  id?: number
}

const BROWSE_CATEGORIES: TCurrentCategory[] = [
  { id: 1, name: 'School life' },
  { id: 2, name: 'Backgrounds' },
  { id: 3, name: 'Sports' },
]

export default function PhotoListWrap() {
  const [recommendImgList, setRecommendImgList] = useState<TGetImageListResult[]>([])
  const [loadDone, setLoadDone] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [currentCategory, setCurrentCategory] = useState<TCurrentCategory | null>(null)
  const [types, setTypes] = useState<TCurrentCategory[]>([])
  const [showList, setShowList] = useState<TGetImageListResult[][]>([])
  const [notice, setNotice] = useState('')

  const loading = useRef(false)
  const page = useRef(0)
  const doneRef = useRef(false)
  const keywordRef = useRef('')
  const categoryRef = useRef<TCurrentCategory | null>(null)
  const recommendRef = useRef<TGetImageListResult[]>([])
  recommendRef.current = recommendImgList

  const isViewingList = Boolean(keyword) || Boolean(currentCategory)
  const listTitle = useMemo(() => (keyword ? `“${keyword}”` : currentCategory?.name ?? ''), [keyword, currentCategory])

  useEffect(() => {
    let cancelled = false
    setTypes(BROWSE_CATEGORIES)
    ;(async () => {
      const collected: TGetImageListResult[][] = []
      let firstNotice = ''
      for (const iterator of BROWSE_CATEGORIES) {
        const { list = [], error } = await api.material.getImagesList({ cate: iterator.id, pageSize: 2 })
        if (error && !firstNotice) firstNotice = PHOTO_NOTICES[error]
        collected.push(list)
      }
      if (cancelled) return
      firstNotice && setNotice(firstNotice)
      setShowList(collected)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const selectImg = async (index: number, list?: TGetImageListResult[]) => {
    const item = list ? list[index] : recommendRef.current[index]
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

  const getDataList = useCallback(async () => {
    if (!(Boolean(keywordRef.current) || Boolean(categoryRef.current)) || doneRef.current || loading.current) {
      return
    }
    loading.current = true
    page.current += 1
    const { list = [], error } = await api.material.getImagesList({
      cate: categoryRef.current?.id,
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
      if (recommendRef.current.length <= 0) {
        setNotice(keywordRef.current ? `No photos match “${keywordRef.current}”. Try a broader word.` : 'No photos here yet.')
      }
    } else {
      setRecommendImgList((prev) => prev.concat(list))
    }
    setTimeout(() => {
      loading.current = false
    }, 100)
  }, [])

  const dragStart = (index: number, list?: TGetImageListResult[]) => {
    const item = list ? list[index] : recommendRef.current[index]
    setSelectItem({ data: { value: item }, type: 'image' })
    api.material.trackImageUse(item.downloadLocation)
  }

  const resetList = () => {
    page.current = 0
    doneRef.current = false
    setLoadDone(false)
    setRecommendImgList([])
    recommendRef.current = []
    setNotice('')
  }

  const searchChange = (next: string) => {
    const trimmed = next.trim()
    if (trimmed === keywordRef.current) {
      return
    }
    keywordRef.current = trimmed
    setKeyword(trimmed)
    categoryRef.current = null
    setCurrentCategory(null)
    resetList()
    trimmed && getDataList()
  }

  const selectTypes = (item: TCurrentCategory) => {
    keywordRef.current = ''
    setKeyword('')
    categoryRef.current = item
    setCurrentCategory(item)
    resetList()
    getDataList()
  }

  const back = () => {
    keywordRef.current = ''
    setKeyword('')
    categoryRef.current = null
    setCurrentCategory(null)
    resetList()
  }

  return (
    <div className="wrap photo-list-wrap">
      <SearchHeader placeholder="Search photos" onSearch={searchChange} />
      <div style={{ height: '0.5rem' }} />

      {!isViewingList ? (
        <>
          {notice ? <p className="notice notice--inset">{notice}</p> : null}
          <ClassHeader
            types={types}
            onSelect={selectTypes}
            renderSection={(index) => (
              <PhotoList
                isShort
                listData={(showList[index] || []) as any}
                onLoad={getDataList}
                onDrag={(i) => dragStart(i, showList[index])}
                onSelect={(i) => selectImg(i, showList[index])}
              />
            )}
          />
        </>
      ) : (
        <div>
          <ClassHeader isBack onBack={back}>
            {listTitle}
          </ClassHeader>
          <br />
          <br />
          <br />
          <div style={{ margin: '0 1rem', height: '100vh' }}>
            {notice ? (
              <p className="notice">{notice}</p>
            ) : (
              <PhotoList isDone={loadDone} listData={recommendImgList as any} onLoad={getDataList} onDrag={(i) => dragStart(i)} onSelect={(i) => selectImg(i)} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
