import Selecto from 'selecto'
import { getElementInfo } from 'moveable'
import { controlState } from '@/store/state'
import { selectWidgetsInOut } from '@/store/widget/select'

export default function useSelecto(moveable: any) {
  const selecto = new Selecto({
    container: document.getElementById('page-design'),
    selectableTargets: ['.layer'],
    selectByClick: false,
    selectFromInside: false,
    continueSelect: false,
    toggleContinueSelect: 'shift',
    keyContainer: document.getElementById('page-design'),
    hitRate: 5,
    getElementRect: getElementInfo,
  } as any)
  selecto
    .on('select', (e) => {
      if (!moveable?.innerMoveable) return
      e.added.forEach((el) => {
        if (!Array.from(el.classList).includes('layer-lock') && !el.hasAttribute('child')) {
          el.classList.add('widget-selected')
          selectWidgetsInOut({ uuid: el.getAttribute('data-uuid') || '' })
        }
      })
      e.removed.forEach((el) => {
        el.classList.remove('widget-selected')
        selectWidgetsInOut({ uuid: el.getAttribute('data-uuid') || '' })
      })
      moveable.renderDirections = []
      moveable.rotatable = false
      moveable.target = [].slice.call(document.querySelectorAll('.widget-selected'))
    })
    .on('dragStart', (e) => {
      // The page resize bars sit inside the selecto container, so grabbing one
      // would otherwise drag a selection box across the canvas as well.
      const target = e.inputEvent?.target as HTMLElement | null
      if (controlState.dSpaceDown || target?.closest?.('.page-resize')) {
        e.stop()
      }
    })
  return selecto
}
