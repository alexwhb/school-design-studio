import { forwardRef, useImperativeHandle, useState } from 'react'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Divider from '@/components/ui/Divider'
import { setShowMoveable } from '@/store/control'
import SizeEditor from './SizeEditor'
import SizePresets from './SizePresets'
import './createDesign.less'

export type CreateDesignHandle = {
  open: () => void
}

/**
 * Starting a new design.
 *
 * Only that. This dialog used to double as the page-size editor for an existing
 * design, with a checkbox deciding whether the artwork moved with it — but that
 * only ever resized the page you were looking at, which quietly left a
 * multi-page design with pages of different sizes. Resizing something that
 * already exists is its own question, and it is asked in ResizeDesign.
 */
const CreateDesign = forwardRef<CreateDesignHandle, {}>(function CreateDesign(_props, ref) {
  const [dialogVisible, setDialogVisible] = useState(false)
  const [page, setPage] = useState({ width: 1275, height: 1650 })

  const open = () => {
    setShowMoveable(false)
    setDialogVisible(true)
  }

  useImperativeHandle(ref, () => ({ open }), [])

  function finish() {
    const { width, height } = page
    window.open(`/home?mode=create&w_h=${width}*${height}`, '_blank')
  }

  return (
    <div>
      <Dialog open={dialogVisible} onOpenChange={setDialogVisible} title="New blank design" width={380} className="is-align-center">
        <SizeEditor params={page} onChange={setPage} className="add-mode">
          <Button onClick={finish} plain size="large" type="primary">
            Create
          </Button>
        </SizeEditor>
        <Divider contentPosition="left">Common sizes</Divider>
        <SizePresets width={page.width} height={page.height} onPick={setPage} />
      </Dialog>
    </div>
  )
})

export default CreateDesign
