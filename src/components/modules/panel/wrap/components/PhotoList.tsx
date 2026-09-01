import { useEffect, useRef, useState } from 'react'
import DragHelper from '@/common/hooks/dragHelper'
import setImageData, { type TItem2DataParam } from '@/common/methods/DesignFeatures/setImage'
import Image from '@/components/ui/Image'
import type { IGetTempListData } from '@/api/home'
import EditModel from './EditModel'
import ImageTip from './ImageTip'
import './photoList.less'

type Props = {
  listData: IGetTempListData[]
  edit?: Record<string, any>
  isDone?: boolean
  isShort?: boolean
  canDrag?: boolean
  onLoad?: () => void
  onSelect?: (index: number) => void
  onDrag?: (index: number) => void
}

const dragHelper = new DragHelper()
const marginRight = 6
const standardHeight = 280

/** Every list this renders — uploads, photos, templates — carries an id. */
const keyOf = (item: IGetTempListData) => String(item.id ?? item.url)

export default function PhotoList({
  listData = [],
  edit,
  isDone,
  isShort = false,
  canDrag = true,
  onLoad,
  onSelect,
  onDrag,
}: Props) {
  const listRef = useRef<HTMLUListElement | null>(null)
  const [loading, setLoading] = useState(true)
  const [list, setList] = useState<IGetTempListData[]>([])
  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })

  useEffect(() => {
    if (listData.length <= 0) {
      setList([])
      return
    }

    const father = listRef.current?.parentElement
    const limitWidth = (father ? father.offsetWidth : 0) - marginRight
    if (limitWidth <= 0) return

    setList((prev) => {
      // Entries are matched to what is already laid out by id rather than by
      // object identity. A page of results only ever appends, so identity was
      // enough for that; but an entry that merely *changed* — one just marked
      // deleted, say — is a new object too, and identity reads that as another
      // photo and packs a second copy of it in beside the original.
      const laidOut = new Map(prev.map((x) => [keyOf(x), x]))
      const live = new Set(listData.map(keyOf))
      // Something went away, so the row it sat in no longer fills the width:
      // pack the whole list again rather than leaving a hole behind.
      const dropped = prev.some((x) => !live.has(keyOf(x)))
      const fresh = dropped ? listData : listData.filter((v) => !laidOut.has(keyOf(v)))
      const pending: IGetTempListData[] = JSON.parse(JSON.stringify(fresh))

      const neatArr: IGetTempListData[][] = []

      function calculate(cutArr: IGetTempListData[]) {
        let cumulate = 0
        for (const iterator of cutArr) {
          const { width, height } = iterator
          cumulate += width / height
        }
        return (limitWidth - marginRight * (cutArr.length - 1)) / cumulate
      }

      function factory(cutArr: IGetTempListData[]): { height: number; list: IGetTempListData[] } {
        const lineup = pending.shift()
        if (!lineup) {
          return { height: calculate(cutArr), list: cutArr }
        }
        cutArr.push(lineup)
        const finalHeight = calculate(cutArr)
        if (finalHeight > standardHeight) {
          return factory(cutArr)
        }
        return { height: finalHeight, list: cutArr }
      }

      while (pending.length > 0) {
        const { list: rowList, height } = factory([pending.shift() as IGetTempListData])
        neatArr.push(
          rowList.map((x, index) => {
            x.listWidth = (x.width / x.height) * height
            x.gap = index !== rowList.length - 1 ? marginRight : 0
            return x
          }),
        )
      }

      const packed = new Map(neatArr.flat(1).map((x) => [keyOf(x), x]))
      return listData.map((item) => {
        const measured = packed.get(keyOf(item))
        if (measured) return measured
        // Already on screen: take the caller's latest copy of it, keeping the
        // width it was packed at so the rows around it do not jump.
        const { listWidth, gap } = laidOut.get(keyOf(item)) as IGetTempListData
        return { ...item, listWidth, gap }
      })
    })
    setLoading(false)
  }, [listData])

  const mouseup = (e: React.MouseEvent) => {
    e.preventDefault()
    setTimeout(() => {
      isDrag.current = false
      startPoint.current = { x: 99999, y: 99999 }
    }, 10)
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

  const load = () => {
    setLoading(true)
    onLoad?.()
  }

  const select = (i: number) => {
    !isDrag.current && !list[i].isDelect && onSelect?.(i)
  }

  const dragStart = async (e: React.MouseEvent, i: number) => {
    e.preventDefault()
    if (!canDrag) {
      return
    }
    startPoint.current = { x: e.clientX, y: e.clientY }
    if (!list[i].isDelect) {
      const setImageParams: TItem2DataParam = {
        width: list[i].width,
        height: list[i].height,
        url: list[i].url || '',
        model: list[i].model,
      }
      const img = await setImageData(setImageParams)
      dragHelper.start(e.nativeEvent, img.canvasWidth)
      onDrag?.(i)
    }
  }

  const scrollEvent = (e: React.UIEvent<HTMLUListElement>) => {
    const target = e.target as HTMLElement
    if (target.scrollTop + target.offsetHeight + 200 >= target.scrollHeight) {
      load()
    }
  }

  const getInnerHeight = ({ height, listWidth, width }: any) => (height * listWidth) / width

  return (
    <ul ref={listRef} className="img-list-wrap" style={{ paddingBottom: isShort ? '15px' : '200px' }} onScroll={scrollEvent}>
      <div className="list">
        {list.map((item, i) => (
          <div
            // Keyed by the photo, not by the slot: a removal shifts everything
            // after it up a place, and an index key would hand the next photo
            // the previous one's loaded/failed state along with the slot.
            key={keyOf(item)}
            style={{ width: item.listWidth + 'px', marginRight: item.gap + 'px', cursor: canDrag ? 'grab' : 'pointer' }}
            className="list__img"
            draggable={false}
            onMouseDown={(e) => dragStart(e, i)}
            onMouseMove={mousemove}
            onMouseUp={mouseup}
            onClick={(e) => {
              e.stopPropagation()
              select(i)
            }}
          >
            {edit ? (
              <EditModel options={edit as any} data={{ item, i }}>
                {item.isDelect ? <div className="list__mask">Deleted</div> : null}
                <Image className="img transparent-bg" src={item.thumb || item.url} style={{ height: getInnerHeight(item) + 'px' }} lazy />
              </EditModel>
            ) : (
              <ImageTip detail={item as any}>
                <Image
                  className="img"
                  src={item.thumb || item.url}
                  style={{ height: getInnerHeight(item) + 'px' }}
                  lazy
                  placeholder={<div style={{ backgroundColor: item.color }} className="image-color" />}
                />
              </ImageTip>
            )}
          </div>
        ))}
      </div>
      {!isDone ? (
        loading ? (
          <div className="loading">
            <i className="el-icon-loading" /> Loading
          </div>
        ) : null
      ) : (
        <div className="loading">That is everything</div>
      )}
    </ul>
  )
}
