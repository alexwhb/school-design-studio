/**
 * The tool dock: the row of tools that floats at the bottom of the canvas well.
 *
 * It replaced the Tools panel, which took a whole left-hand tab to hold seven
 * buttons and pushed the board over every time you wanted one. Everything on it
 * either arms a tool and waits for a gesture on the page — Text, the shapes,
 * the pen — or puts something on the page outright, which is `addFromDock`.
 * What each tool is called and what it says once it is armed comes from
 * `drawTools`, so the dock, the keyboard shortcuts and the hint above it cannot
 * drift apart.
 *
 * It is drawn from the page strip rather than from the editor's root because
 * the two stand on the same edge: the strip, the notes drawer and the dock all
 * sit absolutely inside #main, which scrolls, so all three count that scroll
 * back out, and the dock has to stand on whatever the other two are taking.
 *
 * Nothing here stops a press: the dock is a sibling of #page-design rather than
 * a layer over it, so the board's own listeners and the drag-select box never
 * see these clicks and the document still brackets them for undo.
 */
import { useEffect, useState } from 'react'
import { useSnapshot } from 'valtio'
import { canvasState, controlState } from '@/store/state'
import { setDrawTool, toggleDrawTool } from '@/store/control'
import { addWidget } from '@/store/widget'
import { recordHistory } from '@/common/hooks/history'
import { NOTES_DRAWER_HEIGHT, notesState } from '@/store/notes'
import setImageData from '@/common/methods/DesignFeatures/setImage'
import eventBus from '@/utils/plugins/eventBus'
import Popover from '@/components/ui/Popover'
import Tooltip from '@/components/ui/Tooltip'
import Uploader, { type TModelData, type TUploadDoneData } from '@/components/common/Uploader/Uploader'
import wImageSetting from '@/components/modules/widgets/wImage/wImageSetting'
import { drawToolOrder, drawTools, toolHint } from '@/components/business/draw-shape/drawTools'
import {
  ChevronUpIcon,
  PictureIcon,
  QrCodeIcon,
  SelectToolIcon,
  ShapesIcon,
  TableIcon,
  UploadArrowIcon,
} from '@/components/ui/icons'
import { cx } from '@/utils/dom'
import type { TDrawTool } from '@/store/types'
import { addQrcode, addTable } from './addFromDock'
import './toolDock.less'

/**
 * How much room the folded page chip takes along the bottom — its own height
 * plus the inset it sits at — and the gap the dock keeps above whatever is
 * under it. Mirrored by `.fold` in multipleBoards.less and by the zoom pill,
 * which stand at the same height as each other.
 */
const CHIP_ROW = 48
const DOCK_GAP = 10

/**
 * What the Shapes menu offers. The pen has a slot of its own on the bar, so
 * listing it here as well would be the same tool twice a centimetre apart.
 * Filtered here rather than dropped from `drawToolOrder`, which is the list of
 * every tool that arms, in the order Adobe XD has them.
 */
const shapesMenu = drawToolOrder.filter((tool) => tool !== 'pen')

export default function ToolDock() {
  const { dDrawTool: armed, dLinePreset } = useSnapshot(controlState)
  const bottomHeight = useSnapshot(canvasState).dBottomHeight
  const notesOpen = useSnapshot(notesState).open
  const [open, setOpen] = useState<'shapes' | 'image' | null>(null)
  const [percent, setPercent] = useState<TModelData>({ num: 0 })
  const [st, setSt] = useState(0)
  const [sl, setSl] = useState(0)

  useEffect(() => {
    const mainEl = document.getElementById('main')
    if (!mainEl) return
    const onScroll = () => {
      setSt(mainEl.scrollTop)
      setSl(mainEl.scrollLeft)
    }
    mainEl.addEventListener('scroll', onScroll)
    return () => mainEl.removeEventListener('scroll', onScroll)
  }, [])

  // An armed tool wants the page to itself, so opening a popover is the only
  // thing that survives one being armed elsewhere.
  useEffect(() => {
    if (armed) setOpen(null)
  }, [armed])

  const notesHeight = notesOpen ? NOTES_DRAWER_HEIGHT : 0
  // What the page strip is taking is whatever `dBottomHeight` has over the
  // drawer. Folded away into its chip that is nothing, and the chip's own row
  // is what the dock stands on instead.
  const stripHeight = Math.max(bottomHeight - notesHeight, 0)
  const bottom = notesHeight + (stripHeight || CHIP_ROW) + DOCK_GAP - st

  function pick(tool: TDrawTool) {
    toggleDrawTool(tool)
    setOpen(null)
  }

  function browsePhotos() {
    setOpen(null)
    eventBus.emit('open-panel', 'photo-list-wrap')
  }

  /**
   * A file picked off this machine, scaled to the page and dropped in the
   * middle of it — the same landing an upload gets from the panel. Bracketed by
   * hand because nothing pressed anything: the file dialog answered minutes
   * after the click that opened it.
   */
  async function placeUpload(res: TUploadDoneData) {
    setOpen(null)
    // The Photos panel's own uploads section listens for this and reloads.
    eventBus.emit('refreshUserImages')
    const setting = JSON.parse(JSON.stringify(wImageSetting))
    const img = await setImageData({ width: res.width, height: res.height, url: res.url })
    setting.width = img.width
    setting.height = img.height
    setting.imgUrl = res.url
    const { width: pW, height: pH } = canvasState.dPage
    setting.left = Math.round(pW / 2 - img.width / 2)
    setting.top = Math.round(pH / 2 - img.height / 2)
    recordHistory(() => addWidget(setting))
  }

  const PenToolIcon = drawTools.pen.Icon
  const TextIcon = drawTools.text.Icon
  const hint = armed ? toolHint(armed, dLinePreset) : null
  const shapeArmed = !!armed && armed !== 'pen' && armed !== 'text'

  return (
    <div className="tool-dock" style={{ bottom: bottom + 'px', left: sl + 'px' }}>
      <div className="tool-dock__column">
        {hint ? (
          <div className="draw-hint" role="status">
            <span className="draw-hint__text">
              <b>{hint.lead}</b> {hint.rest}
            </span>
            <button type="button" className="draw-hint__esc" title="Put the pointer back" onClick={() => setDrawTool(null)}>
              Esc
            </button>
          </div>
        ) : null}
        <div className="tool-dock__bar">
          <DockButton label="Select" tool="select" quiet={!!armed} active={!armed} onClick={() => setDrawTool(null)}>
            <SelectToolIcon className="tool-dock__icon" />
          </DockButton>
          <DockButton
            label={`${drawTools.text.label} (${drawTools.text.shortcut})`}
            tool="text"
            quiet={!!armed}
            active={armed === 'text'}
            onClick={() => pick('text')}
          >
            <TextIcon className="tool-dock__icon" />
          </DockButton>
          <Popover
            placement="top"
            open={open === 'shapes'}
            onOpenChange={(next) => setOpen(next ? 'shapes' : null)}
            popperClass="tool-dock__popper"
            content={
              <div className="tool-dock__shapes">
                {shapesMenu.map((tool) => {
                  const { Icon, label, shortcut } = drawTools[tool]
                  return (
                    <Tooltip key={tool} content={`${label} (${shortcut})`} placement="top" showAfter={400}>
                      <button
                        type="button"
                        className={cx('tool-dock__shape', { 'is-armed': armed === tool })}
                        data-tool={tool}
                        aria-label={label}
                        onClick={() => pick(tool)}
                      >
                        <Icon className="tool-dock__shape-icon" />
                      </button>
                    </Tooltip>
                  )
                })}
              </div>
            }
          >
            <DockButton label="Shapes" tool="shapes" wide quiet={!!armed} active={shapeArmed}>
              <ShapesIcon className="tool-dock__icon" />
              <ChevronUpIcon className="tool-dock__caret" />
            </DockButton>
          </Popover>
          <DockButton
            label={`${drawTools.pen.label} (${drawTools.pen.shortcut})`}
            tool="pen"
            quiet={!!armed}
            active={armed === 'pen'}
            onClick={() => pick('pen')}
          >
            <PenToolIcon className="tool-dock__icon" />
          </DockButton>
          <Popover
            placement="top"
            open={open === 'image'}
            onOpenChange={(next) => setOpen(next ? 'image' : null)}
            popperClass="tool-dock__popper"
            content={
              <div className="tool-dock__menu">
                <Uploader className="tool-dock__upload" value={percent} onChange={setPercent} onDone={placeUpload}>
                  <span className="tool-dock__row">
                    <span className="tool-dock__row-icon">
                      <UploadArrowIcon />
                    </span>
                    <span className="tool-dock__row-label">Upload from device</span>
                    <span className="tool-dock__row-meta">jpg, png</span>
                  </span>
                </Uploader>
                <button type="button" className="tool-dock__row" onClick={browsePhotos}>
                  <span className="tool-dock__row-icon">
                    <PictureIcon />
                  </span>
                  <span className="tool-dock__row-label">Browse photos</span>
                  <span className="tool-dock__row-meta">opens panel</span>
                </button>
              </div>
            }
          >
            <DockButton label="Image" tool="image" quiet={!!armed}>
              <PictureIcon className="tool-dock__icon" />
            </DockButton>
          </Popover>
          <i className="tool-dock__divider" />
          <DockButton label="QR code" tool="qrcode" quiet={!!armed} onClick={addQrcode}>
            <QrCodeIcon className="tool-dock__icon" />
          </DockButton>
          <DockButton label="Table" tool="table" quiet={!!armed} onClick={addTable}>
            <TableIcon className="tool-dock__icon" />
          </DockButton>
        </div>
      </div>
    </div>
  )
}

type DockButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  tool: string
  active?: boolean
  wide?: boolean
  /**
   * Hold the tooltip back. A tooltip is an overlay, and an overlay takes Escape
   * for itself — so one left open under the pointer after a tool was armed from
   * this very button would swallow the key the hint above it is offering. It
   * would also sit on top of that hint, which says more than the tooltip does.
   */
  quiet?: boolean
  /** React 19 hands a function component its ref as a prop; Radix needs it here. */
  ref?: React.Ref<HTMLButtonElement>
}

/**
 * One slot on the dock. Everything it is not using itself goes straight onto
 * the button, so a slot that opens a popover — which Radix drives by cloning
 * its trigger — is written the same way as one that does not.
 */
function DockButton({ label, tool, active, wide, quiet, children, ...rest }: DockButtonProps) {
  return (
    <Tooltip content={label} placement="top" showAfter={400} disabled={quiet}>
      <button
        {...rest}
        type="button"
        className={cx('tool-dock__item', { 'is-armed': active, 'is-wide': wide })}
        data-tool={tool}
        aria-label={label}
        aria-pressed={active}
      >
        {children}
      </button>
    </Tooltip>
  )
}
