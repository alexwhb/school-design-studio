/**
 * What the app the editor is embedded in has taken over.
 *
 * Standalone, the editor owns everything: the design lives in IndexedDB, so do
 * the uploads and the brand kit, and Save means "save on this computer". Inside
 * the planner none of that is true — the school's designs belong to the school,
 * the pictures belong to its file store, and Save means a request. Rather than
 * a flag per feature threaded down through six components, the host's answers
 * are put in one context at the root and read where they matter.
 *
 * Nothing here decides anything. Each piece of the editor reads the one answer
 * it needs and behaves the way it always did when there is none.
 */
import { createContext, useContext, type MutableRefObject, type ReactNode } from 'react'
import type { DesignDocument, DesignKind, DesignOp, RejectedOp } from '@/compose/types'

export type { DesignDocument, DesignKind, DesignOp }

/** A picture in the host's own store, as the Photos panel needs to show it. */
export type HostUpload = {
  id: string
  url: string
  width: number
  height: number
  name: string
}

/**
 * The host's file store, standing in for the browser's.
 *
 * Three calls, because that is all the Uploads section does: list what is
 * there, take a file, and forget one. Given, IndexedDB is neither read nor
 * written — a picture a teacher uploaded on the staffroom machine is on their
 * laptop too, which is the whole reason to hand this over.
 */
export type HostUploads = {
  list(): Promise<HostUpload[]>
  upload(file: File): Promise<HostUpload>
  remove(id: string): Promise<void>
}

/**
 * The editor, as something the host can drive.
 *
 * Reached through the component's `ref`. Everything on it is a whole-document
 * operation on purpose: a host that could move one widget by ten pixels would,
 * and a layout composed for a school would slowly stop being one.
 */
export type DesignStudioHandle = {
  /** Plain JSON, safe to structured-clone or stringify. Never the live store. */
  getDocument(): DesignDocument
  setDocument(doc: DesignDocument, opts?: { resetHistory?: boolean }): void
  applyOps(ops: DesignOp[]): { applied: number; rejected: RejectedOp[] }
  exportPdf(): Promise<Blob>
  exportPptx(): Promise<Blob>
  /** `scale` 1 is the page's own pixel size. */
  exportPng(pageIndex: number, opts?: { scale?: number }): Promise<Blob>
  goToPage(index: number): void
  isDirty(): boolean
}

export type HostApi = {
  /** The design the host owns, or null when the editor keeps its own. */
  document: DesignDocument | null
  documentKind: DesignKind
  /** True when the host handed a document in, whatever it held. */
  hostsDocument: boolean
  saveLabel: string
  onSave: ((doc: DesignDocument) => Promise<void>) | null
  onDocumentChange: ((doc: DesignDocument, meta: { dirty: boolean }) => void) | null
  /** The host's own panel, shown behind an "AI" tab in the rail. */
  assistant: ReactNode | null
  /** Whether the Brand panel may change the kit, or only show and use it. */
  brandReadOnly: boolean
  brandReadOnlyNote: string
  /** Filled in by the editor screen; read by the component's own ref. */
  handleRef: MutableRefObject<DesignStudioHandle | null>
}

/** Said above a Brand panel the reader is not allowed to change. */
export const BRAND_READ_ONLY_NOTE = 'Only an administrator can change the school’s brand.'

export const HostApiContext = createContext<HostApi | null>(null)

const NONE: HostApi = {
  document: null,
  documentKind: 'slides',
  hostsDocument: false,
  saveLabel: 'Save',
  onSave: null,
  onDocumentChange: null,
  assistant: null,
  brandReadOnly: false,
  brandReadOnlyNote: BRAND_READ_ONLY_NOTE,
  handleRef: { current: null },
}

/** The host's answers, or the standalone editor's, which is what NONE is. */
export function useHostApi(): HostApi {
  return useContext(HostApiContext) ?? NONE
}
