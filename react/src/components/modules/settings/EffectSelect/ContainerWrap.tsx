import { useEffect, useState } from 'react'
import api from '@/api'
import Button from '@/components/ui/Button'
import Image from '@/components/ui/Image'
import Popover from '@/components/ui/Popover'
import { wSvgSetting } from '@/components/modules/widgets/wSvg/wSvgSetting'
import './containerWrap.less'

type Props = {
  value?: string
  onChange?: (setting: Record<string, any>) => void
}

export default function ContainerWrap({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false)
  const [type, setType] = useState('tuxing')
  const [list, setList] = useState<{ thumb: string; url: string }[]>([])

  useEffect(() => {
    let cancelled = false
    api.material.getList({ cate: 'mask' }).then((res) => {
      if (cancelled) return
      setList(res.list.map(({ thumb, url }) => ({ thumb, url })))
    })
    return () => {
      cancelled = true
    }
  }, [type])

  const select = (url: string = '') => {
    setVisible(false)
    const setting = JSON.parse(JSON.stringify(wSvgSetting))
    setting.svgUrl = url
    onChange?.(setting)
  }

  return (
    <div className="el-card is-hover-shadow box-card">
      <div className="el-card__header">
        <div className="card-header">
          <span className="title">Image mask</span>
          <Popover
            placement="bottom-end"
            width={260}
            open={visible}
            onOpenChange={setVisible}
            content={
              <>
                <div className="box__header">
                  <div className="el-radio-group">
                    <label className="el-radio-button is-active el-radio-button--small">
                      <input type="radio" className="el-radio-button__original-radio" checked readOnly onChange={() => setType('tuxing')} />
                      <span className="el-radio-button__inner">Shape</span>
                    </label>
                  </div>
                </div>
                <div className="select__box">
                  <div className="select__box__select-item" onClick={() => select()}>
                    None
                  </div>
                  {list.map((item, i) => (
                    <Image key={i + 'l'} className="select__box__select-item" src={item.thumb} fit="contain" onClick={() => select(item.url)} />
                  ))}
                </div>
              </>
            }
          >
            <Button className="button" link onClick={() => setVisible(!visible)}>
              {visible ? 'Cancel' : 'Choose'}
            </Button>
          </Popover>
        </div>
      </div>
      <div className="el-card__body" style={{ padding: 0 }} />
    </div>
  )
}
