import { useRef } from 'react'
import Button from '@/components/ui/Button'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget'
import { wTextSetting } from '../../widgets/wText/wTextSetting'
import CompListWrap from './CompListWrap'
import './textListWrap.less'

type TBasicTextData = {
  text: string
  placeholder: string
  fontSize: number
  fontWeight: string
}

const basicTextList: TBasicTextData[] = [
  { text: 'Heading', placeholder: 'Add a heading', fontSize: 72, fontWeight: 'bold' },
  { text: 'Subheading', placeholder: 'Add a subheading', fontSize: 40, fontWeight: 'bold' },
  { text: 'Body text', placeholder: 'Add a little bit of body text', fontSize: 24, fontWeight: 'normal' },
]

const previewSize = (fontSize: number) => Math.round(Math.min(Math.max(fontSize / 3, 13), 22))

export default function TextListWrap() {
  const insertedCount = useRef(0)

  const selectBasicText = (item: TBasicTextData) => {
    setShowMoveable(false)

    const setting = JSON.parse(JSON.stringify(wTextSetting))
    setting.text = item.placeholder
    setting.fontSize = item.fontSize
    setting.fontWeight = item.fontWeight

    const { width: pW, height: pH } = canvasState.dPage
    const widthPerChar = item.fontWeight === 'bold' ? 0.64 : 0.55
    const estimated = item.fontSize * widthPerChar * setting.text.length
    setting.width = Math.round(Math.min(estimated, pW * 0.8))

    const lineHeight = item.fontSize * setting.lineHeight
    const step = insertedCount.current % 6
    insertedCount.current += 1
    setting.left = Math.round((pW - setting.width) / 2)
    setting.top = Math.round((pH - lineHeight) / 2 + step * lineHeight * 1.4)

    addWidget(setting)
  }

  const openPSD = () => {
    window.open('/psd?type=1', '_blank')
  }

  return (
    <div id="text-list-wrap" style={{ marginTop: '0.5rem' }}>
      <ul className="basic-text-wrap">
        {basicTextList.map((item, index) => (
          <div
            key={index}
            className="basic-text-item"
            style={{ fontSize: previewSize(item.fontSize) + 'px', fontWeight: item.fontWeight }}
            draggable
            onClick={() => selectBasicText(item)}
          >
            {item.text}
          </div>
        ))}
      </ul>
      <Button className="upload-psd" plain type="primary" onClick={openPSD}>
        Import a PSD file
      </Button>
      <div className="other-text-wrap">
        <CompListWrap />
      </div>
    </div>
  )
}
