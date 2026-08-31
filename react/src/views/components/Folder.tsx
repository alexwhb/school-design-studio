import type { ReactNode } from 'react'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import { CheckIcon } from '@/components/ui/icons'
import useSpellcheck from '@/common/hooks/useSpellcheck'
import './folder.less'

type Props = {
  onSelect: (name: string) => void
  /** Ticked state for the rulers, which the editor owns. */
  showGuides?: boolean
  children: ReactNode
}

/**
 * The File menu.
 *
 * Three groups, divided: what to do with the whole design, what to do with the
 * file, and what the editor itself shows you. The last group's items are
 * settings rather than actions, so they carry a tick showing what they are
 * currently set to — a menu item that silently toggles something is a menu item
 * you have to press to find out.
 */
export default function Folder({ onSelect, showGuides, children }: Props) {
  // Read straight from the module-level preference rather than passed down:
  // every text widget already reads the same one, and threading it through the
  // toolbar would only give it a second source of truth.
  const { enabled: spellcheck, toggleSpellcheck } = useSpellcheck()

  const openPSD = () => {
    window.open('/psd', '_blank')
  }

  return (
    <Dropdown
      placement="bottom-start"
      size="large"
      menuClassName="ds-folder-menu"
      menu={
        <>
          <DropdownItem onSelect={() => onSelect('newDesign')}>
            <div className="item">New design</div>
          </DropdownItem>
          <DropdownItem onSelect={() => onSelect('resizeDesign')}>
            <div className="item">Resize design…</div>
          </DropdownItem>
          <DropdownItem onSelect={openPSD}>Import file</DropdownItem>
          <DropdownItem divided onSelect={() => onSelect('save')}>
            Save
          </DropdownItem>
          <DropdownItem onSelect={() => onSelect('download')}>Export file</DropdownItem>
          <DropdownItem disabled>Version history</DropdownItem>
          <DropdownItem disabled>Batch apply template</DropdownItem>
          <DropdownItem divided onSelect={() => onSelect('changeLineGuides')}>
            <div className="item item--toggle">
              <span>Rulers and guides</span>
              {showGuides ? (
                <i className="el-icon tick">
                  <CheckIcon />
                </i>
              ) : null}
            </div>
          </DropdownItem>
          <DropdownItem onSelect={toggleSpellcheck}>
            <div className="item item--toggle">
              <span>Check spelling</span>
              {spellcheck ? (
                <i className="el-icon tick">
                  <CheckIcon />
                </i>
              ) : null}
            </div>
          </DropdownItem>
        </>
      }
    >
      <span className="el-dropdown-link">{children}</span>
    </Dropdown>
  )
}
