import { useEffect, useMemo, useRef, useState } from 'react'
import { useSnapshot } from 'valtio'
import Sortable from 'sortablejs'
import { widgetState } from '@/store/state'
import { selectWidget, updateHoverUuid, updateWidgetData } from '@/store/widget'
import { cx } from '@/utils/dom'
import type { TdWidgetData } from '@/store/types'
import './layerList.less'

type Props = {
  data: TdWidgetData[]
  onChange: (widgets: TdWidgetData[]) => void
}

function buildWidgets(data: readonly TdWidgetData[]): TdWidgetData[] {
  const widgets: TdWidgetData[] = []
  const len = data.length
  const childs: TdWidgetData[] = []
  for (let i = len - 1; i >= 0; --i) {
    const widget = JSON.parse(JSON.stringify(data[i]))
    if (widget.parent != -1) {
      childs.unshift(widget)
    } else {
      widgets.push(widget)
    }
  }
  for (const item of childs) {
    const index = widgets.findIndex((x) => x.uuid === item.parent)
    widgets.splice(index + 1, 0, item)
  }
  return widgets
}

function layerThumb(element: any) {
  const source: string = element.svgUrl || element.imgUrl || ''
  if (!source.trimStart().startsWith('<')) return source
  const markup = (element.colors || []).reduce((acc: string, color: string, i: number) => acc.split(`{{colors[${i}]}}`).join(color), source)
  return `data:image/svg+xml;utf8,${encodeURIComponent(markup)}`
}

export default function LayerList({ data, onChange }: Props) {
  const snap = useSnapshot(widgetState)
  const listRef = useRef<HTMLUListElement | null>(null)
  const [drag, setDrag] = useState(false)
  const [widgets, setWidgets] = useState<TdWidgetData[]>(() => buildWidgets(data))
  const widgetsRef = useRef(widgets)
  widgetsRef.current = widgets

  const source = useMemo(() => snap.dWidgets, [snap.dWidgets])

  useEffect(() => {
    setWidgets(buildWidgets(widgetState.dWidgets))
  }, [source])

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const sortable = Sortable.create(el, {
      animation: 300,
      ghostClass: 'ghost',
      chosenClass: 'choose',
      onStart: () => setDrag(true),
      onMove: (evt: any) => {
        const relatedElement = widgetsRef.current[Array.prototype.indexOf.call(evt.to.children, evt.related)]
        const draggedElement = widgetsRef.current[Number(evt.dragged.dataset.index)]
        return (!relatedElement || relatedElement.parent == '-1') && draggedElement?.parent == '-1'
      },
      onEnd: (evt: any) => {
        setDrag(false)
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) {
          onChange(widgetsRef.current)
          return
        }
        const parent = evt.from as HTMLElement
        if (oldIndex < newIndex) {
          parent.insertBefore(evt.item, parent.children[oldIndex])
        } else {
          parent.insertBefore(evt.item, parent.children[oldIndex + 1])
        }
        const next = widgetsRef.current.slice()
        const [moved] = next.splice(oldIndex, 1)
        next.splice(newIndex, 0, moved)
        setWidgets(next)
        onChange(next)
      },
    })
    return () => sortable.destroy()
  }, [onChange])

  function getIsActive(uuid: string) {
    if (widgetState.dSelectWidgets.length > 0) {
      return !!widgetState.dSelectWidgets.find((item) => item.uuid === uuid)
    }
    return uuid === widgetState.dActiveElement?.uuid
  }

  function showItem(item: TdWidgetData) {
    return drag === true && item.parent != '-1' ? false : true
  }

  function lockLayer(item: TdWidgetData) {
    updateWidgetData({
      uuid: item.uuid,
      key: 'lock',
      value: typeof item.lock === 'undefined' ? true : !item.lock,
    })
  }

  return (
    <ul className="widget-list" ref={listRef}>
      {widgets.map((element, index) => (
        <li
          key={element.uuid}
          data-index={index}
          className={cx('widget', { active: getIsActive(element.uuid), disable: !showItem(element) }, 'item-one')}
          onClick={() => selectWidget({ uuid: element.uuid })}
          onMouseOver={() => updateHoverUuid(element.uuid)}
          onMouseOut={() => updateHoverUuid('-1')}
        >
          {Number(element.parent) !== -1 ? <span className="second-layer" /> : null}
          {layerThumb(element) ? (
            <img className="widget-type widget-type__img" src={layerThumb(element)} />
          ) : (
            <span className={cx('widget-type', 'icon', `sd-${element.type}`, element.type)} />
          )}
          <span className={cx('widget-name', 'line-clamp-1', element.type)}>
            {element.text || element.name} {element.mask ? '(container)' : ''}
          </span>
          <div className="widget-out" data-type={element.type} data-uuid={element.uuid}>
            <i
              className={cx('icon', element.lock ? 'sd-suoding' : 'sd-jiesuo')}
              onClick={(e) => {
                e.stopPropagation()
                lockLayer(element)
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
