import type { ReactNode } from 'react'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import './folder.less'

export default function Folder({ onSelect, children }: { onSelect: (name: string) => void; children: ReactNode }) {
  const openPSD = () => {
    window.open('/psd', '_blank')
  }

  return (
    <Dropdown
      placement="bottom-start"
      menuClassName="ds-folder-menu"
      menu={
        <>
          <DropdownItem onSelect={() => onSelect('newDesign')}>
            <div className="item">New design</div>
          </DropdownItem>
          <DropdownItem onSelect={openPSD}>Import file</DropdownItem>
          <DropdownItem divided onSelect={() => onSelect('save')}>
            Save
          </DropdownItem>
          <DropdownItem onSelect={() => onSelect('download')}>Export file</DropdownItem>
          <DropdownItem disabled>Version history</DropdownItem>
          <DropdownItem disabled>Batch apply template</DropdownItem>
          <DropdownItem divided onSelect={() => onSelect('changeLineGuides')}>
            Rulers and guides
          </DropdownItem>
        </>
      }
    >
      <span className="el-dropdown-link">{children}</span>
    </Dropdown>
  )
}
