import { forwardRef, useImperativeHandle, useState } from 'react'
import sizes from '@/assets/data/PageSizeData'
import Dialog from '@/components/ui/Dialog'
import Button from '@/components/ui/Button'
import Checkbox from '@/components/ui/Checkbox'
import Divider from '@/components/ui/Divider'
import { setShowMoveable } from '@/store/control'
import { autoResizeAll } from '@/store/widget/resize'
import SizeEditor from './SizeEditor'
import './createDesign.less'

export type CreateDesignHandle = {
  open: () => void
}

type Props = {
  params?: any
}

const CreateDesign = forwardRef<CreateDesignHandle, Props>(function CreateDesign({ params }, ref) {
  const [dialogVisible, setDialogVisible] = useState(false)
  const [isAdaptive, setIsAdaptive] = useState(true)
  const [page, setPage] = useState({ width: 100, height: 100 })

  const applySize = ({ width, height }: { width: number; height: number }) => {
    setPage({ width, height })
  }

  const open = () => {
    setShowMoveable(false)
    if (params) {
      setPage({ width: params.width, height: params.height })
    }
    setDialogVisible(true)
  }

  useImperativeHandle(ref, () => ({ open }), [params])

  function finish() {
    const { width, height } = page
    if (params) {
      const lastPageData = JSON.parse(JSON.stringify(params))
      params.width = width
      params.height = height
      isAdaptive && autoResizeAll(lastPageData)
    } else {
      window.open(`/home?mode=create&w_h=${width}*${height}`, '_blank')
    }
  }

  return (
    <div>
      <Dialog open={dialogVisible} onOpenChange={setDialogVisible} title={params ? 'Page size' : 'New blank design'} width={380} className="is-align-center">
        {params ? <Checkbox value={isAdaptive} onChange={setIsAdaptive} label="Resize and reposition everything to fit" size="large" /> : null}
        <SizeEditor params={page} onChange={setPage} className={params ? 'editor-mode' : 'add-mode'}>
          <Button onClick={finish} plain size="large" type="primary">
            {params ? 'Apply' : 'Create'}
          </Button>
        </SizeEditor>
        <Divider />
        <ul className="pre-list">
          {sizes.map((s, si) => (
            <li onClick={() => applySize(s)} className="item" key={'s' + si}>
              <i className={`icon ${s.icon}`} /> {s.name} <span className="info">{s.width} × {s.height} px</span>
            </li>
          ))}
        </ul>
      </Dialog>
    </div>
  )
})

export default CreateDesign
