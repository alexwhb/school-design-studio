import { Suspense, forwardRef, lazy, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Uploader from '@/components/common/Uploader/Uploader'
import message from '@/components/ui/message'
import { UploadFilledIcon } from '@/components/ui/icons'
import _dl from '@/common/methods/download'
import { setShowMoveable } from '@/store/control'
/**
 * Loaded on demand. The eraser carries a canvas engine and its own reactivity
 * runtime, and most people never open this dialog — there is no reason for any
 * of it to be in the bundle that draws the editor.
 */
const ImageExtraction = lazy(() => import('./ImageExtraction'))
type ImageExtractionHandle = import('./ImageExtraction').ImageExtractionHandle
import { saveCutOut } from './method'
import type { LocalUpload } from '@/common/methods/localUploads'
import './imageCutout.less'

export type ImageCutoutHandle = {
  open: (file?: File) => void
}

type Props = {
  onDone?: (saved: LocalUpload) => void
}

/**
 * Remove background.
 *
 * Upstream shipped this as a demo: whichever file you picked was thrown away and
 * a stock photo was loaded from an image host instead, then a second stock photo
 * stood in for the result. The matting service behind it is not ours to call, so
 * the work is done here instead, by the brush-based eraser in
 * packages/image-extraction. Nothing leaves the browser, and the result lands in
 * the Uploads panel like every other picture.
 */
const ImageCutout = forwardRef<ImageCutoutHandle, Props>(function ImageCutout({ onDone }, ref) {
  const [show, setShow] = useState(false)
  const [rawImage, setRawImage] = useState('')
  const [cutImage, setCutImage] = useState('')
  const [offsetWidth, setOffsetWidth] = useState(0)
  const [percent, setPercent] = useState(0)
  /** True when opened from the Tools panel, false when opened from a picture already on the page. */
  const [toolModel, setToolModel] = useState(true)
  const [loading, setLoading] = useState(false)

  const rawRef = useRef<HTMLImageElement | null>(null)
  const matting = useRef<ImageExtractionHandle | null>(null)
  const fileName = useRef('cut-out.png')
  const isRunning = useRef(false)
  /** The eraser opens itself once per picture, but not again after a Start over. */
  const opened = useRef(false)
  const rawImageRef = useRef('')
  rawImageRef.current = rawImage
  const cutImageRef = useRef('')
  cutImageRef.current = cutImage

  const clear = useCallback(() => {
    if (rawImageRef.current) URL.revokeObjectURL(rawImageRef.current)
    setRawImage('')
    setCutImage('')
    setPercent(0)
    setOffsetWidth(0)
    setLoading(false)
    opened.current = false
  }, [])

  const handleUploaderLoad = useCallback((file: File) => {
    if (rawImageRef.current) URL.revokeObjectURL(rawImageRef.current)
    // An object URL, not a data URL: this only has to outlive the dialog, the
    // eraser reads it back with fetch(), and base64 would double a phone photo
    // in memory for no gain. The result is what gets stored.
    setRawImage(URL.createObjectURL(file))
    fileName.current = file.name || fileName.current
    opened.current = false
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      open(file?: File) {
        clear()
        setShow(true)
        // Opened from a picture on the page: that picture is the subject, so
        // there is nothing to choose and the result replaces it rather than
        // being downloaded.
        setToolModel(!file)
        setShowMoveable(false)
        if (file) requestAnimationFrame(() => handleUploaderLoad(file))
      },
    }),
    [clear, handleUploaderLoad],
  )

  useEffect(() => {
    if (!show) setShowMoveable(true)
  }, [show])

  /** Sweeps the reveal across once so it is obvious what changed. */
  const run = useCallback(() => {
    isRunning.current = true
    const step = () => {
      setPercent((value) => {
        if (value >= 100) {
          isRunning.current = false
          return 100
        }
        requestAnimationFrame(step)
        return value + 1
      })
    }
    requestAnimationFrame(step)
  }, [])

  const openEraser = useCallback(() => {
    if (!matting.current || !rawImageRef.current) return
    // The eraser masks whatever is opaque in the second picture, so handing it
    // the original as its own starting mask means "everything is kept" — which
    // is the right place to start erasing from. After one pass it re-opens on
    // the result, so a second go touches up rather than starting again.
    matting.current.open(rawImageRef.current, cutImageRef.current || rawImageRef.current, (base64: string) => {
      if (!base64) return
      setCutImage(base64)
      setPercent(0)
      run()
    })
  }, [run])

  /** Sizes the comparison box to the picture as laid out, so both layers line up. */
  function measure() {
    setOffsetWidth(rawRef.current?.offsetWidth || 0)
    if (!opened.current) {
      opened.current = true
      openEraser()
    }
  }

  function mousemove(e: React.MouseEvent<HTMLImageElement>) {
    if (isRunning.current) return
    setPercent((e.nativeEvent.offsetX / (e.target as HTMLImageElement).width) * 100)
  }

  async function cutDone() {
    setLoading(true)
    const saved = await saveCutOut(cutImage)
    setLoading(false)
    if (!saved) {
      message({ message: 'That picture could not be saved. Please try again.', type: 'error' })
      return
    }
    onDone?.(saved)
    setShow(false)
  }

  return (
    <Dialog
      open={show}
      onOpenChange={setShow}
      title="Remove background"
      width={650}
      className="is-align-center ds-image-cutout"
      footer={
        <span className="dialog-footer">
          {cutImage ? (
            <>
              {toolModel ? <Button onClick={clear}>Start over</Button> : null}
              <Button plain onClick={openEraser}>
                Edit again
              </Button>
              {toolModel ? <Button onClick={() => _dl.downloadBase64File(cutImage, fileName.current)}>Download</Button> : null}
              <Button type="primary" disabled={loading} onClick={cutDone}>
                {loading ? 'Saving…' : 'Use this picture'}
              </Button>
            </>
          ) : rawImage ? (
            <>
              {toolModel ? <Button onClick={clear}>Choose another</Button> : null}
              <Button type="primary" onClick={openEraser}>
                Erase background
              </Button>
            </>
          ) : null}
        </span>
      }
    >
      {!rawImage ? (
        <Uploader hold drag className="uploader" onLoad={handleUploaderLoad}>
          <div className="uploader__box">
            <UploadFilledIcon style={{ width: 64, height: 64 }} />
            <div className="el-upload__text">Choose a picture, then brush away the parts you don't want.</div>
          </div>
          <div className="el-upload__tip el-upload__text">
            <em>It stays on this computer. Nothing is uploaded.</em>
          </div>
        </Uploader>
      ) : (
        <div className="content">
          <div style={{ width: offsetWidth ? offsetWidth + 'px' : '100%' }} className="scan-effect transparent-bg">
            <img
              ref={rawRef}
              style={{ clipPath: cutImage ? `inset(0 0 0 ${percent}%)` : undefined }}
              src={rawImage}
              alt=""
              onLoad={measure}
            />
            {cutImage ? <img src={cutImage} alt="Result" onMouseMove={mousemove} /> : null}
            {cutImage ? <div style={{ left: percent + '%' }} className="scan-line" /> : null}
          </div>
          {cutImage ? <p className="hint">Move the pointer across the picture to compare it with the original.</p> : null}
        </div>
      )}
      <Suspense fallback={null}>{show ? <ImageExtraction ref={matting} /> : null}</Suspense>
    </Dialog>
  )
})

export default ImageCutout
