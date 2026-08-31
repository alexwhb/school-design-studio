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

const marginRight = 6
const standardHeight = 280

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
  const prevData = useRef<IGetTempListData[]>([])
  const dragHelper = useRef(new DragHelper())
  const isDrag = useRef(false)
  const startPoint = useRef({ x: 99999, y: 99999 })

  useEffect(() => {
    const oldList = prevData.current
    prevData.current = listData
    if (listData.length <= 0) {
      setList([])
      return
    }
    let pending = listData.filter((v) => !oldList.includes(v))
    pending = JSON.parse(JSON.stringify(pending))

    const father = listRef.current?.parentElement
    const limitWidth = (father ? father.offsetWidth : 0) - marginRight
    if (limitWidth <= 0) return

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

    setList((prev) => prev.concat(neatArr.flat(1)))
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
      dragHelper.current.start(e.nativeEvent, img.canvasWidth)
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
            key={i + 'i'}
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
