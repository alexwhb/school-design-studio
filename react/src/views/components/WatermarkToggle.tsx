import { useState } from 'react'
import { changeWatermark } from '@/store/base'
import _config from '@/config'
import Switch from '@/components/ui/Switch'
import Tooltip from '@/components/ui/Tooltip'
import './watermarkToggle.less'

export default function WatermarkToggle() {
  const [enabled, setEnabled] = useState(false)

  function wmChange(value: boolean) {
    setEnabled(value)
    changeWatermark(value ? [_config.APP_NAME] : '')
  }

  return (
    <Tooltip content="Stamp a faint name across the page" placement="bottom" showAfter={400}>
      <label className="watermark-toggle">
        <Switch value={enabled} onChange={wmChange} size="small" />
        <span className="watermark-toggle__label">Watermark</span>
      </label>
    </Tooltip>
  )
}
