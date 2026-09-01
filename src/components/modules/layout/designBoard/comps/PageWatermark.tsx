import type { CSSProperties, ReactNode } from 'react'
import { useSnapshot } from 'valtio'
import { baseState } from '@/store/state'
import { useEditorMode } from '@/common/hooks/useEditorMode'
import Watermark from '@/components/common/Watermark'

export default function PageWatermark({ customStyle, children }: { customStyle?: CSSProperties; children: ReactNode }) {
  const mode = useEditorMode()
  const { watermark } = useSnapshot(baseState)

  if (mode === 'draw') return <>{children}</>

  return (
    <Watermark style={customStyle} gap={[140, 120]} content={watermark as string | string[]}>
      {children}
    </Watermark>
  )
}
