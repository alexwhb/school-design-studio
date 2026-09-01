import { useCallback, useEffect, useRef, useState } from 'react'
import api from '@/api'
import type { IGetTempListData } from '@/api/home'
import setImageData, { type TItem2DataParam } from '@/common/methods/DesignFeatures/setImage'
import useConfirm from '@/common/methods/confirm'
import { deleteUpload, listUploads } from '@/common/methods/localUploads'
import eventBus from '@/utils/plugins/eventBus'
import useInfiniteScroll from '@/common/hooks/useInfiniteScroll'
import { replaceQuery } from '@/common/hooks/useRouteQuery'
import Button from '@/components/ui/Button'
import Tabs from '@/components/ui/Tabs'
import Uploader, { type TModelData, type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget, setSelectItem } from '@/store/widget'
import wImageSetting from '../../widgets/wImage/wImageSetting'
import PhotoList from './components/PhotoList'
import ImgWaterFall from './components/ImgWaterFall'
import './userWrap.less'

export default function UserWrap() {
  const [percent, setPercent] = useState<TModelData>({ num: 0 })
  const [imgList, setImgList] = useState<IGetTempListData[]>([])
  const [designList, setDesignList] = useState<IGetTempListData[]>([])
  const [isDone, setIsDone] = useState(false)
  const [tabActiveName, setTabActiveName] = useState('')
  const [deleted, setDeleted] = useState<Record<number, boolean>>({})

  const listRef = useRef<HTMLUListElement | null>(null)
  const loading = useRef(false)
  const listPage = useRef(0)
  const doneRef = useRef(false)
  const imgListRef = useRef<IGetTempListData[]>([])
  imgListRef.current = imgList

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
    const list = (await listUploads().catch(() => [])) as unknown as IGetTempListData[]
    setImgList(list)
    doneRef.current = true
    setIsDone(true)
    loading.current = false
  }, [])

  const loadDesign = useCallback((init: boolean = false) => {
    if (init) {
      setDesignList([])
      listPage.current = 0
      doneRef.current = false
      setIsDone(false)
    }
    if (doneRef.current || loading.current) {
      return
    }
    loading.current = true
    listPage.current += 1
    api.home.getMyDesign({ page: listPage.current, pageSize: 10 }).then(({ list }) => {
      if (list.length <= 0) {
        doneRef.current = true
        setIsDone(true)
      } else {
        setDesignList((prev) =>
          prev.concat(
            list.map((x) => {
              x.cover = x.cover + '?r=' + Math.random()
              return x
            }),
          ),
        )
      }
      setTimeout(() => {
        loading.current = false
        if (!listRef.current) return
        checkHeight(listRef.current, loadDesign)
      }, 100)
    })
  }, [])

  function checkHeight(el: HTMLElement, loadFn: Function) {
    if (el.offsetHeight && el.firstElementChild) {
      const isLess = el.offsetHeight > (el.firstElementChild as HTMLElement).offsetHeight
      isLess && loadFn()
    }
  }

  useInfiniteScroll(listRef, loadDesign, 150, tabActiveName === 'design')

  useEffect(() => {
    load(true)
    setTabActiveName('pics')
    const refresh = () => {
      setImgList([])
      doneRef.current = false
      load(true)
    }
    eventBus.on('refreshUserImages', refresh)
    return () => {
      eventBus.off('refreshUserImages', refresh)
    }
  }, [load])

  const selectImg = async (index: number) => {
    const item = imgListRef.current[index]
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
  }

  const deleteImg = async ({ i, item }: { i: number; item: Required<TItem2DataParam> }) => {
    setShowMoveable(false)
    const isPass = await useConfirm(
      'Remove this upload?',
      'It will disappear from anything on the page that uses it.',
      'warning',
    )
    if (!isPass) {
      return false
    }
    await deleteUpload(String(item.id))
    setDeleted((prev) => ({ ...prev, [i]: true }))
    setImgList((prev) => prev.map((entry, index) => (index === i ? { ...entry, isDelect: true } : entry)))
  }

  const deleteWorks = async ({ item }: { i: number; item: Required<TItem2DataParam> }) => {
    const isPass = await useConfirm('Warning', 'This cannot be undone. Are you sure?', 'warning')
    if (isPass) {
      await api.material.deleteMyWorks({ id: item.id })
      setTimeout(() => {
        replaceQuery({})
        loadDesign(true)
      }, 300)
    }
  }

  const editOptions = {
    photo: [{ name: 'Delete', fn: deleteImg }],
    works: [{ name: 'Delete', fn: deleteWorks }],
  }

  const dragStart = (index: number) => {
    const item = imgListRef.current[index]
    setSelectItem({ data: { value: item }, type: 'image' })
  }

  const uploadDone = (res: TUploadDoneData) => {
    const newList = [res as unknown as IGetTempListData, ...imgListRef.current]
    setImgList([])
    setTimeout(() => {
      setImgList(newList)
    }, 300)
  }

  const tabChange = (tabName: string) => {
    setTabActiveName(tabName)
    if (tabName === 'design') {
      loadDesign(true)
    }
  }

  const selectDesign = async (item: IGetTempListData) => {
    const { id } = item
    window.open(`${window.location.protocol + '//' + window.location.host}/home?id=${id}`)
  }

  const openPSD = () => {
    window.open('/psd', '_blank')
  }

  return (
    <div className="wrap user-wrap">
      <Tabs
        className="tabs"
        value={tabActiveName}
        onChange={tabChange}
        items={[
          { name: 'pics', label: 'Manage files' },
          { name: 'design', label: 'My designs' },
        ]}
      />
      <div style={{ display: tabActiveName === 'pics' ? undefined : 'none' }}>
        <div className="upload-actions">
          <Uploader value={percent} className="upload" onChange={setPercent} onDone={uploadDone}>
            <Button className="upload-btn" plain>
              <i className="iconfont icon-upload" /> Upload image
            </Button>
          </Uploader>
          <Button className="upload-btn" plain onClick={openPSD}>
            Import a PSD file
          </Button>
        </div>
        <div style={{ margin: '1rem', height: '100vh' }}>
          <PhotoList edit={editOptions.photo as any} isDone={isDone} listData={imgList} onLoad={() => load()} onDrag={dragStart} onSelect={selectImg} />
        </div>
      </div>
      <div className="wrap" style={{ display: tabActiveName === 'design' ? undefined : 'none' }}>
        <ul ref={listRef} className="infinite-list" style={{ overflow: 'auto' }}>
          <ImgWaterFall edit={editOptions.works as any} listData={designList} onSelect={selectDesign} />
          {isDone ? <div className="loading">That is everything</div> : null}
        </ul>
      </div>
    </div>
  )
}
