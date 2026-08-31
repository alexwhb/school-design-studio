import { forwardRef, useImperativeHandle, useState } from 'react'
import Dialog from '@/components/ui/Dialog'

export type ImageCutoutHandle = {
  open: (file?: File) => void
}

type Props = {
  onDone?: (url: string) => void
}

const ImageCutout = forwardRef<ImageCutoutHandle, Props>(function ImageCutout(_props, ref) {
  const [visible, setVisible] = useState(false)
  useImperativeHandle(ref, () => ({ open: () => setVisible(true) }), [])

  return (
    <Dialog open={visible} onOpenChange={setVisible} title="Remove background" width={800}>
      <div style={{ padding: '2rem 0', textAlign: 'center' }}>Background removal is not available in this build.</div>
    </Dialog>
  )
})

export default ImageCutout
