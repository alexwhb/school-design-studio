import { forwardRef, useEffect, useImperativeHandle, useState, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import Button from '@/components/ui/Button'
import { CloseIcon } from '@/components/ui/icons'
import { getPortalContainer } from '@/common/hooks/appRoot'

export type TourHandle = {
  open: () => void
}

type Step = {
  title: string
  description: string
  placement: 'top' | 'bottom' | 'left' | 'right'
}

const STEPS: Step[] = [
  {
    title: 'File menu',
    description: 'Use the File menu to start a new design, import or export files, and change page settings.',
    placement: 'bottom',
  },
  { title: 'Toolbar', description: 'Start from a template, or drag text, photos and shapes onto your page.', placement: 'right' },
  {
    title: 'Settings panel',
    description: 'Select anything on the page and its settings appear here. Switch to Layers to reorder items.',
    placement: 'left',
  },
  { title: 'Download', description: 'Export your design as an image, PDF or PowerPoint file.', placement: 'bottom' },
]

type Props = {
  steps: RefObject<HTMLElement | null>[]
}

const Tour = forwardRef<TourHandle, Props>(function Tour({ steps }, ref) {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)

  useImperativeHandle(
    ref,
    () => ({
      open: () => {
        setCurrent(0)
        setOpen(true)
      },
    }),
    [],
  )

  useEffect(() => {
    if (!open) return
    const target = steps[current]?.current
    setRect(target ? target.getBoundingClientRect() : null)
  }, [open, current, steps])

  if (!open) return null

  const step = STEPS[current]
  const gap = 6
  const box = rect ? { left: rect.left - gap, top: rect.top - gap, width: rect.width + gap * 2, height: rect.height + gap * 2 } : { left: 0, top: 0, width: 0, height: 0 }

  const contentStyle: React.CSSProperties = { position: 'fixed', zIndex: 2005, width: 300 }
  if (step.placement === 'bottom') {
    contentStyle.left = box.left
    contentStyle.top = box.top + box.height + 12
  } else if (step.placement === 'right') {
    contentStyle.left = box.left + box.width + 12
    contentStyle.top = box.top
  } else if (step.placement === 'left') {
    contentStyle.left = Math.max(12, box.left - 312)
    contentStyle.top = box.top
  } else {
    contentStyle.left = box.left
    contentStyle.top = Math.max(12, box.top - 160)
  }

  const close = () => setOpen(false)

  return createPortal(
    <>
      <div
        className="el-tour__mask"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 2001,
          pointerEvents: 'auto',
        }}
        onClick={close}
      >
        <svg style={{ width: '100%', height: '100%' }}>
          <defs>
            <mask id="ds-tour-mask">
              <rect x="0" y="0" width="100%" height="100%" fill="white" />
              <rect x={box.left} y={box.top} width={box.width} height={box.height} rx="6" fill="black" />
            </mask>
          </defs>
          <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#ds-tour-mask)" />
        </svg>
      </div>
      <div className="el-tour__content" style={contentStyle}>
        <div className="el-tour__header">
          <span className="el-tour__title">{step.title}</span>
          <button className="el-tour__closebtn" onClick={close} aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <div className="el-tour__body">{step.description}</div>
        <div className="el-tour__footer">
          <span className="el-tour__indicators">
            {STEPS.map((_, i) => (
              <span key={i} className={i === current ? 'el-tour__indicator is-active' : 'el-tour__indicator'} />
            ))}
          </span>
          <div className="ds-tour-buttons">
            {current > 0 ? (
              <Button size="small" onClick={() => setCurrent(current - 1)}>
                Previous
              </Button>
            ) : null}
            {current < STEPS.length - 1 ? (
              <Button size="small" type="primary" onClick={() => setCurrent(current + 1)}>
                Next
              </Button>
            ) : (
              <Button size="small" type="primary" onClick={close}>
                Finish
              </Button>
            )}
          </div>
        </div>
      </div>
    </>,
    getPortalContainer() ?? document.body,
  )
})

export default Tour
