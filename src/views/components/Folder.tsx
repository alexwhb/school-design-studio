import type { ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import { CheckIcon } from '@/components/ui/icons'
import useSpellcheck from '@/common/hooks/useSpellcheck'
import { cx } from '@/utils/dom'
import { GRID_SIZES, controlState } from '@/store/state'
import { setGridSize, toggleShowGrid, toggleSnapEnabled } from '@/store/control'
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

  // Snapping is the editor's own state, so unlike the rulers above it needs no
  // help from the toolbar to know whether it is on.
  const { dSnapEnabled: snapEnabled, dShowGrid: showGrid, dGridSize: gridSize } = useSnapshot(controlState)

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
          <DropdownItem onSelect={() => onSelect('findReplace')}>
            <div className="item">Find and replace…</div>
          </DropdownItem>
          <DropdownItem onSelect={() => onSelect('bulkDocuments')}>
            <div className="item">Make one for each person…</div>
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
          <DropdownItem onSelect={toggleSnapEnabled}>
            <div className="item item--toggle">
              <span>Snap to objects</span>
              {snapEnabled ? (
                <i className="el-icon tick">
                  <CheckIcon />
                </i>
              ) : null}
            </div>
          </DropdownItem>
          <DropdownItem onSelect={toggleShowGrid}>
            <div className="item item--toggle">
              <span>Show grid</span>
              {showGrid ? (
                <i className="el-icon tick">
                  <CheckIcon />
                </i>
              ) : null}
            </div>
          </DropdownItem>
          {/*
            The spacings sit on their own row rather than behind a submenu: it
            is three numbers, and putting them in front of you is shorter than
            opening anything. Choosing one turns the grid on, since asking for
            25px squares and being given none would be a strange answer. The
            menu is held open so you can see the page change behind it.
          */}
          <DropdownItem closeOnSelect={false}>
            <div className="item item--toggle">
              <span>Grid spacing</span>
              <span className="grid-sizes">
                {GRID_SIZES.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className={cx('grid-size', { 'is-on': showGrid && gridSize === size })}
                    onClick={() => setGridSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </span>
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
