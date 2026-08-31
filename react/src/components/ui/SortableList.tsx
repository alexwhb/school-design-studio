import { useEffect, useRef, type ReactNode } from 'react'
import Sortable from 'sortablejs'

type Props<T> = {
  items: T[]
  getKey: (item: T, index: number) => string
  renderItem: (item: T, index: number) => ReactNode
  onReorder: (items: T[]) => void
  handle?: string
  className?: string
}

export default function SortableList<T>({ items, getKey, renderItem, onReorder, handle, className }: Props<T>) {
  const listRef = useRef<HTMLDivElement | null>(null)
  const itemsRef = useRef(items)
  itemsRef.current = items
  const onReorderRef = useRef(onReorder)
  onReorderRef.current = onReorder

  useEffect(() => {
    const el = listRef.current
    if (!el) return
    const sortable = Sortable.create(el, {
      animation: 300,
      ghostClass: 'ghost',
      chosenClass: 'choose',
      handle,
      onEnd: (evt: any) => {
        const { oldIndex, newIndex } = evt
        if (oldIndex === undefined || newIndex === undefined || oldIndex === newIndex) return
        const parent = evt.from as HTMLElement
        if (oldIndex < newIndex) {
          parent.insertBefore(evt.item, parent.children[oldIndex])
        } else {
          parent.insertBefore(evt.item, parent.children[oldIndex + 1])
        }
        const next = itemsRef.current.slice()
        const [moved] = next.splice(oldIndex, 1)
        next.splice(newIndex, 0, moved)
        onReorderRef.current(next)
      },
    })
    return () => sortable.destroy()
  }, [handle])

  return (
    <div ref={listRef} className={className}>
      {items.map((item, index) => (
        <div key={getKey(item, index)}>{renderItem(item, index)}</div>
      ))}
    </div>
  )
}
