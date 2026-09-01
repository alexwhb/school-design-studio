import { useEffect, useMemo, useRef, useState } from 'react'
import Image from '@/components/ui/Image'
import type { IGetTempListData } from '@/api/home'
import EditModel from './EditModel'
import './imgWaterFall.less'

type Props = {
  listData: IGetTempListData[]
  edit?: Record<string, any>
  onSelect?: (item: IGetTempListData) => void
  onLoad?: () => void
}

const columnNums = 2
const gap = 7

export default function ImgWaterFall({ listData, edit, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(146)
  const [failed, setFailed] = useState<Record<string | number, boolean>>({})

  useEffect(() => {
    const available = containerRef.current?.clientWidth
    if (!available) return
    const next = Math.floor((available - gap * (columnNums - 1)) / columnNums)
    if (next !== width) setWidth(next)
  }, [listData, width])

  const { list, countHeight } = useMemo(() => {
    const columnHeights: number[] = []
    const widthLimit = width * columnNums
    const cloneList = JSON.parse(JSON.stringify(listData)) as any[]
    for (let i = 0; i < cloneList.length; i++) {
      let index = i % columnNums
      const item = cloneList[i]
      item.height = (item.height / item.width) * width
      item.left = index * (widthLimit / columnNums + gap)
      item.top = columnHeights[index] + gap || 0
      if (isNaN(columnHeights[index])) {
        columnHeights[index] = item.height
      } else {
        index = columnHeights.indexOf(Math.min(...columnHeights))
        item.left = index * (widthLimit / columnNums + gap)
        item.top = columnHeights[index] + gap || 0
        columnHeights[index] = item.height + columnHeights[index] + gap
      }
    }
    return { list: cloneList, countHeight: columnHeights.length ? Math.max(...columnHeights) : 0 }
  }, [listData, width])

  return (
    <div ref={containerRef} style={{ height: countHeight + 'px' }} className="img-water-fall">
      {list.map((item: any, i: number) => (
        <div
          key={i + 'iwf'}
          style={{ top: item.top + 'px', left: item.left + 'px', width: width + 'px', height: item.height + 'px' }}
          className="img-box"
          onClick={(e) => {
            e.stopPropagation()
            onSelect?.(item)
          }}
        >
          {edit ? (
            <EditModel options={edit as any} data={{ item, i }}>
              {item.isDelect ? <div className="list__mask">Deleted</div> : null}
              {!failed[i] ? (
                <Image className="img" src={item.cover} lazy onError={() => setFailed((f) => ({ ...f, [i]: true }))} />
              ) : (
                <div className="fail_img">{item.title}</div>
              )}
            </EditModel>
          ) : (
            <Image className="img" src={item.cover} lazy onError={() => setFailed((f) => ({ ...f, [i]: true }))} />
          )}
        </div>
      ))}
    </div>
  )
}
