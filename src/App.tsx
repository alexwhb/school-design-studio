import type { ComponentType } from 'react'
import { EditorModeContext, type EditorMode } from '@/common/hooks/useEditorMode'
import { TooltipProvider } from '@/components/ui/Tooltip'
import Draw from './views/Draw'
import Html from './views/Html'
import Index from './views/Index'
import Psd from './views/Psd'
import './app.less'

function resolveMode(): EditorMode {
  const path = window.location.pathname
  if (path.startsWith('/draw')) return 'draw'
  if (path.startsWith('/html')) return 'html'
  if (path.startsWith('/psd')) return 'psd'
  return 'home'
}

const screens: Record<EditorMode, ComponentType> = {
  home: Index,
  draw: Draw,
  html: Html,
  psd: Psd,
}

export default function App() {
  const mode = resolveMode()
  const Screen = screens[mode]
  return (
    <div id="app-view">
      <EditorModeContext.Provider value={mode}>
        <TooltipProvider>
          <Screen />
        </TooltipProvider>
      </EditorModeContext.Provider>
    </div>
  )
}
