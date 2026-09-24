export { default as DesignStudio } from './DesignStudio'
// Read-only, for phones. `design-studio/viewer` has it without the editor.
export { default as DesignViewer } from './viewer/DesignViewer'
export type { DesignViewerProps } from './viewer/DesignViewer'
export type { DesignStudioProps } from './DesignStudio'
export { configure } from './config'
export type { DesignStudioConfig } from './config'
export { setBackgroundRemover, canRemoveBackground } from './common/methods/backgroundRemoval'
export type { TBackgroundRemover, TRemovalProgress } from './common/methods/backgroundRemoval'
export type { EditorMode } from './common/hooks/useEditorMode'
export type { TBrandKit, TBrandFonts, TBrandLogo } from './common/methods/brandKit'
export type { DesignStudioHandle, HostUpload, HostUploads } from './common/hooks/hostApi'
export type { DesignIssue, DesignIssueKind } from './common/methods/accessibility/checkDesign'
// The document types are the compose entry's, not a second copy: a host that
// composes a deck on its server and opens it in the browser is holding one
// shape all the way through.
export type { DesignDocument, DesignKind, DesignOp, TdLayout } from './compose/types'
