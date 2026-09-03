import { useMemo, useRef, useState } from 'react'
import Image from '@/components/ui/Image'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget'
import { wTextSetting } from '../../widgets/wText/wTextSetting'
import SearchHeader from './components/SearchHeader'
import PanelEyebrow from './components/PanelEyebrow'
import Card, { CardGrid, CardRows } from './components/Card'
import useCompPresets from './components/compPresets'
import { PanelBody, PanelHead, PanelSectionBlock, PanelWrap } from './components/PanelShell'
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
  const [keyword, setKeyword] = useState('')
  const { list: effects, itemProps } = useCompPresets('text')

  // Nothing here is paged, so the search is a filter over what is already on
  // screen rather than another trip to the library.
  const query = keyword.trim().toLowerCase()
  const styles = useMemo(() => basicTextList.filter((item) => !query || item.text.toLowerCase().includes(query)), [query])
  const effectList = useMemo(
    () => effects.filter((item) => !query || (item.title || '').toLowerCase().includes(query)),
    [effects, query],
  )

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
    <PanelWrap id="text-list-wrap">
      <PanelHead>
        <SearchHeader value={keyword} live placeholder="Search text styles" onChange={setKeyword} onSearch={setKeyword} />
      </PanelHead>

      <PanelBody>
        {styles.length > 0 ? (
          <PanelSectionBlock>
            <PanelEyebrow label="Text styles" />
            <CardRows className="basic-text-wrap">
              {styles.map((item) => (
                <div
                  key={item.text}
                  className="panel-card panel-card--row basic-text-item"
                  draggable
                  onClick={() => selectBasicText(item)}
                >
                  {/* Drawn at the weight and the relative size it will land on
                      the page at, so the three rows are a picture of the choice
                      rather than three labels. */}
                  <span className="basic-text-item__label" style={{ fontSize: previewSize(item.fontSize) + 'px', fontWeight: item.fontWeight }}>
                    {item.text}
                  </span>
                  <span className="basic-text-item__meta">
                    {item.fontSize} / {wTextSetting.fontFamily}
                  </span>
                </div>
              ))}
            </CardRows>
          </PanelSectionBlock>
        ) : null}

        {effectList.length > 0 ? (
          <PanelSectionBlock>
            {/* The PSD importer opens a page of its own rather than adding
                anything here, so it rides on the heading instead of taking a
                button's worth of the panel. */}
            <PanelEyebrow label="Text with effects" onAction={openPSD} actionLabel="Import a PSD" />
            <CardGrid columns={2}>
              {effectList.map((item) => (
                <Card key={item.id} ratio="16 / 9" thumbClassName="panel-card__thumb--art" {...itemProps(item)}>
                  <Image className="list__img" src={item.cover} fit="contain" lazy />
                </Card>
              ))}
            </CardGrid>
          </PanelSectionBlock>
        ) : null}

        {styles.length === 0 && effectList.length === 0 ? <div className="panel-wrap__status">Nothing matches “{keyword.trim()}”</div> : null}
      </PanelBody>
    </PanelWrap>
  )
}
