import { useEffect, useState, type ComponentType } from 'react'
import { EditorModeContext, type EditorMode } from '@/common/hooks/useEditorMode'
import { loadBrandKit } from '@/common/methods/brandKit'
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
  // The brand kit is read before the screen mounts, as DesignStudio does for
  // the embed, so a template opened by id is filled in from it. It is one
  // small row; a browser that will not open the database gets an empty kit.
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let cancelled = false
    void loadBrandKit().finally(() => {
      if (!cancelled) setReady(true)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return (
    <div id="app-view">
      {ready ? (
        <EditorModeContext.Provider value={mode}>
          <TooltipProvider>
            <Screen />
          </TooltipProvider>
        </EditorModeContext.Provider>
      ) : null}
    </div>
  )
}
