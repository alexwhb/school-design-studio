import { forwardRef, useEffect, useImperativeHandle, useState } from 'react'
import widgetClassifyListData from '@/assets/data/WidgetClassifyList'
import Tooltip from '@/components/ui/Tooltip'
import { readQuery } from '@/common/hooks/useRouteQuery'
import { cx } from '@/utils/dom'
import { panelComponents } from './panelRegistry'
import './widgetPanel.less'

export type WidgetPanelHandle = {
  clickClassify: (index: number) => void
}

const WidgetPanel = forwardRef<WidgetPanelHandle>(function WidgetPanel(_props, ref) {
  const [activeWidgetClassify, setActiveWidgetClassify] = useState(0)
  const [active, setActive] = useState(true)
  const [mounted, setMounted] = useState<Record<number, boolean>>({ 0: true })

  const clickClassify = (index: number) => {
    if (activeWidgetClassify === index && active) {
      setActive(false)
      return
    }
    setActiveWidgetClassify(index)
    setMounted((prev) => ({ ...prev, [index]: true }))
    setActive(true)
  }

  useImperativeHandle(ref, () => ({ clickClassify }), [activeWidgetClassify, active])

  useEffect(() => {
    const { koutu } = readQuery()
    if (koutu) {
      setActiveWidgetClassify(4)
      setMounted((prev) => ({ ...prev, 4: true }))
    }
  }, [])

  return (
    <div id="widget-panel">
      <div className="widget-classify">
        <ul className="classify-wrap">
          {widgetClassifyListData.map((item, index) => (
            <li
              key={index}
              className={cx('classify-item', { 'active-classify-item': activeWidgetClassify === index && active })}
              onClick={() => clickClassify(index)}
            >
              <div className="icon-box">
                <i className={cx('iconfont', 'rail-icon', item.icon)} style={item.style} />
              </div>
              <p>{item.name}</p>
            </li>
          ))}
        </ul>
      </div>
      <div className="widget-wrap" style={{ display: active ? undefined : 'none' }}>
        {widgetClassifyListData.map((item, index) => {
          if (!mounted[index]) return null
          const Comp = panelComponents[item.component]
          if (!Comp) return null
          return (
            <div key={item.component} style={{ display: activeWidgetClassify === index ? 'contents' : 'none' }}>
              <Comp />
            </div>
          )
        })}
      </div>
      <div className="side-wrap" style={{ display: active ? undefined : 'none' }}>
        <Tooltip content="Hide panel" placement="right" showAfter={300}>
          <div className="pack__up" onClick={() => setActive(false)}>
            <i className="iconfont icon-right" />
          </div>
        </Tooltip>
      </div>
    </div>
  )
})

export default WidgetPanel
