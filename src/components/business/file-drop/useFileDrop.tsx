/**
 * Dragging a picture off the desktop and letting go of it on the design.
 *
 * The editor already accepted a drag from the Photos panel, but that is a
 * mouse-tracked ghost the studio paints itself and has nothing to do with the
 * browser's file drag. Dropping a file from Finder or Explorer did what an
 * unhandled drop always does: the browser navigated the tab to the file, and
 * whatever was unsaved went with it. So this listens whether or not anybody
 * uses it — even the version that only refuses is better than that.
 *
 * A hook rather than a wrapper component, because the element it belongs on
 * already exists: the editor screen's own root, which is the same element in
 * the standalone app and inside a host. A wrapper would have been a new layer
 * between `.ds-root` and a screen whose layout is written against it.
 *
 * The whole screen is the target, not the page: what somebody aims at is "the
 * design", and a drop that lands two pixels outside the page edge should still
 * work. Where the pointer was decides where the picture goes — over the page,
 * under the pointer; anywhere else, the middle of the page.
 */
import { useCallback, useRef, useState, type DragEventHandler } from 'react'
import { IMAGE_UPLOAD_LABEL, pagePointAt, uploadAndPlaceImages } from '@/common/methods/placeImageFile'
import { UploadArrowIcon } from '@/components/ui/icons'
import './fileDrop.less'

/** Whether this drag is carrying files, as opposed to text or a selection. */
function carriesFiles(transfer: DataTransfer | null): boolean {
  if (!transfer) return false
  // `types` is the only thing readable during a drag — `files` is empty until
  // the drop, by design, so a page cannot inspect what is being dragged over it.
  return Array.from(transfer.types || []).includes('Files')
}

export type FileDropHandlers = {
  onDragEnter: DragEventHandler
  onDragOver: DragEventHandler
  onDragLeave: DragEventHandler
  onDrop: DragEventHandler
}

export function useFileDrop(): { dropHandlers: FileDropHandlers; dropOverlay: React.ReactNode } {
  const [over, setOver] = useState(false)
  // dragenter/dragleave fire for every element the pointer crosses on the way
  // in and out, so an overlay that follows them directly flickers. Counting the
  // pairs is what makes it follow the drag rather than the DOM under it.
  const depth = useRef(0)

  const reset = useCallback(() => {
    depth.current = 0
    setOver(false)
  }, [])

  const dropHandlers: FileDropHandlers = {
    onDragEnter: (e) => {
      if (!carriesFiles(e.dataTransfer)) return
      depth.current++
      setOver(true)
    },
    onDragOver: (e) => {
      if (!carriesFiles(e.dataTransfer)) return
      // Without both of these the browser keeps its own handling, and its own
      // handling of a dropped file is to navigate to it.
      e.preventDefault()
      e.dataTransfer.dropEffect = 'copy'
    },
    onDragLeave: (e) => {
      if (!carriesFiles(e.dataTransfer)) return
      depth.current--
      if (depth.current <= 0) reset()
    },
    onDrop: (e) => {
      if (!carriesFiles(e.dataTransfer)) return
      // An inner drop target that already took this file — the PSD screen's own
      // uploader — marks the event handled on its way up. Taking it again here
      // would upload it twice and refuse it once.
      if (e.defaultPrevented) {
        reset()
        return
      }
      e.preventDefault()
      reset()
      const files = Array.from(e.dataTransfer.files || [])
      if (files.length === 0) return
      // Read before the await: `pagePointAt` measures the canvas as it is now,
      // and the first upload can take seconds, in which somebody may have
      // scrolled or zoomed.
      const at = pagePointAt(e.clientX, e.clientY)
      void uploadAndPlaceImages(files, at ?? undefined)
    },
  }

  const dropOverlay = over ? (
    <div className="ds-file-drop__overlay" role="status">
      <div className="ds-file-drop__card">
        <UploadArrowIcon />
        <b>Drop to add it to the page</b>
        <span>{IMAGE_UPLOAD_LABEL}</span>
      </div>
    </div>
  ) : null

  return { dropHandlers, dropOverlay }
}
