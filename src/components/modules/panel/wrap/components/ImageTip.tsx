import type { ReactNode } from 'react'
import Tooltip from '@/components/ui/Tooltip'

export type TImageTipDetailData = {
  author: string
  description: string
}

export default function ImageTip({ detail, children }: { detail: TImageTipDetailData; children: ReactNode }) {
  return (
    <Tooltip
      disabled={!detail.author}
      effect="light"
      placement="bottom"
      content={
        <>
          <p style={{ maxWidth: 140 }}>
            <b>{detail.description}</b>
          </p>
          <p>@{detail.author}</p>
        </>
      }
    >
      {children}
    </Tooltip>
  )
}
