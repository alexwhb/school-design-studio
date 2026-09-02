import { useMemo } from 'react'
import { useSnapshot } from 'valtio'
import layerIconList from '@/assets/data/LayerIconList'
import { widgetState } from '@/store/state'
import { setLayerOrder, updateLayerIndex } from '@/store/widget/layer'
import { recordHistory } from '@/common/hooks/history'
import IconItemSelect, { type TIconItemSelectData } from './IconItemSelect'

type Props = {
  uuid: string
  className?: string
  label?: string
  /** Buttons that belong on the same row but are this panel's own — an image's flips. */
  extra?: TIconItemSelectData[]
  onExtra?: (item: TIconItemSelectData) => void
}

/**
 * Carries out one button of the Arrange row on a layer. Shared with the
 * context menu and the shortcuts, so that "bring to front" means the same
 * thing however it was asked for.
 */
export function arrangeLayer(uuid: string, item: Pick<TIconItemSelectData, 'key' | 'value'>) {
  const widget = widgetState.dWidgets.find((w) => w.uuid === uuid)
  if (!widget) return
  recordHistory(() => {
    switch (item.key) {
      case 'zIndex':
        updateLayerIndex({ uuid, value: Number(item.value), isGroup: widget.isContainer })
        break
      case 'zOrder':
        setLayerOrder({ uuid, to: item.value === 'back' ? 'back' : 'front' })
        break
    }
  })
}

/**
 * The Arrange row: the same buttons in every element's panel, reading the
 * layer's own state so a lock shows as on when the layer is locked.
 */
export default function ArrangeRow({ uuid, className = 'style-item', label = 'Arrange', extra, onExtra }: Props) {
  const snap = useSnapshot(widgetState)
  const widget = snap.dWidgets.find((w) => w.uuid === uuid)

  const items = useMemo(() => {
    const own: TIconItemSelectData[] = layerIconList.map((item) => ({ ...item }))
    return extra ? own.concat(extra) : own
  }, [widget?.lock, extra])

  function finish(item: TIconItemSelectData) {
    if (item.key === 'zIndex' || item.key === 'zOrder') {
      arrangeLayer(uuid, item)
      return
    }
    onExtra?.(item)
  }

  return <IconItemSelect className={className} label={label} data={items} onFinish={finish} />
}
