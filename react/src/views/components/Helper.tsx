import { useState, type ReactNode } from 'react'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import Divider from '@/components/ui/Divider'
import scKeyCodes from '@/mixins/scKeyCodes'
import './helper.less'

export default function Helper({ onSelect, children }: { onSelect: (name: string) => void; children: ReactNode }) {
  const [type, setType] = useState<'menu' | 'shortkey'>('menu')
  const [open, setOpen] = useState(false)

  const openTour = () => {
    onSelect('openTour')
    setOpen(false)
  }

  const openIssues = () => {
    window.open('https://github.com/palxiao/poster-design/issues', '_blank')
  }

  return (
    <Dropdown
      placement="bottom-start"
      maxHeight="70vh"
      menuClassName="ds-helper-menu"
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setType('menu')
      }}
      menu={
        type === 'shortkey' ? (
          <div className="help-list">
            <div onClick={() => setType('menu')} className="back">
              <span className="icon-box">
                <i className="iconfont icon-right" />
              </span>{' '}
              <b>Keyboard shortcuts</b>
            </div>
            <Divider />
            {scKeyCodes.map((sc, si) => (
              <div key={'sc' + si} className="item">
                <span className="title">{sc.feat}</span>
                <span className="instruct">{sc.info}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <DropdownItem closeOnSelect={false} onSelect={() => setType('shortkey')}>
              Keyboard shortcuts
            </DropdownItem>
            <DropdownItem onSelect={openTour}>Take the tour</DropdownItem>
            <DropdownItem onSelect={openIssues}>
              <div className="menu-item">Send feedback</div>
            </DropdownItem>
          </>
        )
      }
    >
      <span className="el-dropdown-link">{children}</span>
    </Dropdown>
  )
}
