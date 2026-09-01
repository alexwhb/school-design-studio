import { createContext, useContext } from 'react'

export type EditorMode = 'home' | 'draw' | 'html' | 'psd'

export const EditorModeContext = createContext<EditorMode>('home')

export function useEditorMode() {
  return useContext(EditorModeContext)
}
