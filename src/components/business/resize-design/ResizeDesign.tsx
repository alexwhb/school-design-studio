import { forwardRef, useImperativeHandle, useState } from 'react'
import { useSnapshot } from 'valtio'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import message from '@/components/ui/message'
import SizeEditor from '@/components/business/create-design/SizeEditor'
import SizePresets from '@/components/business/create-design/SizePresets'
import { canvasState, widgetState } from '@/store/state'
import { resizePages, type TResizeScope } from '@/store/widget/resizePages'
import { DEFAULT_RESIZE_STRATEGY, RESIZE_STRATEGIES } from '@/common/methods/resize/strategies'
import { cx } from '@/utils/dom'
import './resizeDesign.less'

export type ResizeDesignHandle = {
  open: () => void
}

/**
 * Resize an existing design.
 *
 * The reuse people ask for: the flyer that worked becomes a slide, or a display
 * board, without rebuilding it. Three decisions, in the order someone makes
 * them — how big, what happens to the artwork, and how much of the design it
 * applies to — with the outcome stated in words underneath rather than left to
 * be discovered after pressing the button.
 *
 * The choice of what happens to the artwork is not hardcoded here: it renders
 * whatever is in common/methods/resize/strategies.ts.
 */
const ResizeDesign = forwardRef<ResizeDesignHandle, {}>(function ResizeDesign(_props, ref) {
  const canvas = useSnapshot(canvasState)
  const pageCount = useSnapshot(widgetState).dLayouts.length || 1

  const [visible, setVisible] = useState(false)
  const [strategy, setStrategy] = useState(DEFAULT_RESIZE_STRATEGY)
  const [scope, setScope] = useState<TResizeScope>('page')
  const [size, setSize] = useState({ width: 0, height: 0 })

  const current = { width: canvas.dPage?.width || 0, height: canvas.dPage?.height || 0 }
  const changed = Math.round(size.width) !== Math.round(current.width) || Math.round(size.height) !== Math.round(current.height)

  const open = () => {
    setSize({ width: canvasState.dPage?.width || 0, height: canvasState.dPage?.height || 0 })
    setStrategy(DEFAULT_RESIZE_STRATEGY)
    // A single-page design has nothing to choose between, and someone who adds a
    // page later should not inherit a decision they were never shown.
    setScope(widgetState.dLayouts.length > 1 ? 'all' : 'page')
    setVisible(true)
  }

  useImperativeHandle(ref, () => ({ open }), [])

  function apply() {
    const pages = scope === 'all' ? pageCount : 1
    resizePages({ width: size.width, height: size.height, strategy, scope })
    setVisible(false)
    message({
      message: `Resized ${pages === 1 ? 'the page' : `all ${pages} pages`} to ${Math.round(size.width)} × ${Math.round(size.height)} px.`,
      type: 'success',
    })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={setVisible}
      title="Resize design"
      width={420}
      className="is-align-center ds-resize-design"
      footer={
        <>
          <Button onClick={() => setVisible(false)}>Cancel</Button>
          <Button type="primary" disabled={!changed} onClick={apply}>
            Resize
          </Button>
        </>
      }
    >
      <section className="block">
        <h4 className="block__title">New size</h4>
        <SizeEditor params={size} onChange={setSize} className="size-row" />
        <p className="from-to">
          {Math.round(current.width)} × {Math.round(current.height)} px <i className="iconfont icon-right arrow" /> {Math.round(size.width)} × {Math.round(size.height)} px
        </p>
        <SizePresets width={size.width} height={size.height} onPick={setSize} />
      </section>

      <section className="block">
        <h4 className="block__title">What happens to the artwork</h4>
        {RESIZE_STRATEGIES.map((option) => (
          <button key={option.id} type="button" className={cx('choice', { 'is-on': strategy === option.id })} onClick={() => setStrategy(option.id)}>
            <span className="choice__name">{option.name}</span>
            <span className="choice__hint">{option.description}</span>
          </button>
        ))}
      </section>

      {pageCount > 1 ? (
        <section className="block">
          <h4 className="block__title">Apply to</h4>
          <div className="scopes">
            <button type="button" className={cx('scope', { 'is-on': scope === 'page' })} onClick={() => setScope('page')}>
              This page
            </button>
            <button type="button" className={cx('scope', { 'is-on': scope === 'all' })} onClick={() => setScope('all')}>
              All {pageCount} pages
            </button>
          </div>
        </section>
      ) : null}
    </Dialog>
  )
})

export default ResizeDesign
