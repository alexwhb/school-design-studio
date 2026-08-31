import type { ReactNode } from 'react'
import Dropdown, { DropdownItem } from '@/components/ui/DropdownMenu'
import './editModel.less'

type Option = { name: string; fn: (data: any) => void }

type Props = {
  options: Option[]
  data: any
  children?: ReactNode
}

export default function EditModel({ options, data, children }: Props) {
  return (
    <div className="edit-model-wrap">
      {children}
      <div className="showMask" onClick={(e) => e.stopPropagation()}>
        <Dropdown
          placement="bottom-end"
          menu={
            <>
              {(options || []).map((op, oi) => (
                <DropdownItem key={oi + 'o'} onSelect={() => op.fn(data)}>
                  {op.name}
                </DropdownItem>
              ))}
            </>
          }
        >
          <i className="iconfont icon-more" />
        </Dropdown>
      </div>
    </div>
  )
}
