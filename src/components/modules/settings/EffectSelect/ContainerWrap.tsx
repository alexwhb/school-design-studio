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
    // The mask list has one kind in it, so this is a load, not a subscription.
  }, [])

  const select = (url: string = '') => {
    setVisible(false)
    const setting = JSON.parse(JSON.stringify(wSvgSetting))
    setting.svgUrl = url
    onChange?.(setting)
  }

  return (
    // The same shape as every other switchable feature in the panel: what it is
    // called, and the way in. It was a card with a header and an empty body,
    // which is a lot of furniture for one button.
    <div className="mask-row">
      <span className="mask-row__title">Image mask</span>
      <Popover
        placement="bottom-end"
        popperClass="ds-mask-picker"
        width={260}
        open={visible}
        onOpenChange={setVisible}
        content={
          <>
            <div className="box__header">
              <span className="box__title">Shape</span>
            </div>
            <div className="select__box">
              <div className={`select__box__select-item${!value ? ' active' : ''}`} onClick={() => select()}>
                None
              </div>
              {list.map((item, i) => (
                <Image key={i + 'l'} className={`select__box__select-item${item.url === value ? ' active' : ''}`} src={item.thumb} fit="contain" onClick={() => select(item.url)} />
              ))}
            </div>
          </>
        }
      >
        <Button className="mask-row__choose" link onClick={() => setVisible(!visible)}>
          {visible ? 'Cancel' : value ? 'Change mask' : 'Choose'}
        </Button>
      </Popover>
    </div>
  )
}
