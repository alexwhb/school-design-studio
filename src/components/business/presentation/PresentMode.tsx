import { forwardRef } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, widgetState } from '@/store/state'
import { showPage } from '@/store/widget/pages'
import type { TdLayout } from '@/store/types'
import PresentStage, { type PresentModeHandle } from './PresentStage'

export type { PresentModeHandle }

/**
 * Presentation mode in the editor: the design in the store, starting on the
 * page on the canvas, and the canvas left on the slide the talk ended on.
 */
const PresentMode = forwardRef<PresentModeHandle, {}>(function PresentMode(_props, ref) {
  const pages = useSnapshot(widgetState).dLayouts as readonly TdLayout[]
  return (
    <PresentStage
      ref={ref}
      pages={pages}
      currentPage={() => canvasState.dCurrentPage}
      onExit={(page) => {
        // The store owns the order these have to happen in.
        if (page !== canvasState.dCurrentPage && widgetState.dLayouts[page]) showPage(page)
      }}
    />
  )
})

export default PresentMode
