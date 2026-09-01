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

  // This fork's own tracker, not upstream's: a teacher reporting a problem with
  // the school editor should not land on palxiao/poster-design.
  const openIssues = () => {
    window.open('https://github.com/alexwhb/school-design-studio/issues', '_blank')
  }

  return (
    <Dropdown
      placement="bottom-start"
      size="large"
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
