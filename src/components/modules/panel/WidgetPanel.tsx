import { forwardRef, useImperativeHandle, useState } from 'react'
import widgetClassifyListData from '@/assets/data/WidgetClassifyList'
import Tooltip from '@/components/ui/Tooltip'
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

  return (
    <div id="widget-panel">
      <div className="widget-classify">
        {/*
          The rail is how you reach every panel in the editor, so it is a tab
          list you can get to from the keyboard rather than a list of divs that
          only answer a mouse.
        */}
        <ul className="classify-wrap" role="tablist" aria-orientation="vertical" aria-label="Panels">
          {widgetClassifyListData.map((item, index) => {
            const selected = activeWidgetClassify === index && active
            return (
              <li key={index} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  className={cx('classify-item', { 'active-classify-item': selected })}
                  onClick={() => clickClassify(index)}
                >
                  <span className="icon-box">
                    {item.Icon ? <item.Icon className="rail-icon" /> : <i className={cx('iconfont', 'rail-icon', item.icon)} style={item.style} />}
                  </span>
                  <span className="classify-name">{item.name}</span>
                </button>
              </li>
            )
          })}
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
