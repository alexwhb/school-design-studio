/**
 * `design-studio/viewer` — a design, read-only, without the editor.
 *
 * The same `DesignViewer` the main entry exports, from an entry that does not
 * load the editor with it. A host that shows the viewer on a phone and the
 * editor on a laptop imports this one on the phone. See DesignViewer.tsx.
 */
export { default as DesignViewer } from './viewer/DesignViewer'
export type { DesignViewerProps } from './viewer/DesignViewer'
export type { DesignDocument, TdLayout } from './compose/types'
