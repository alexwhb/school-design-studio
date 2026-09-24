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
 * What is known about a stock photograph as it is taken into the host's store.
 *
 * The attribution is passed on because Unsplash's terms ask for it and the host
 * is the one that will still have the picture in a year; the studio has nowhere
 * to keep it once the URL has been replaced.
 */
export type HostImportMeta = {
  name?: string
  width?: number
  height?: number
  attribution?: {
    photographer?: string
    profileUrl?: string
    photoUrl?: string
  }
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
  /**
   * Takes a copy of a picture that lives on somebody else's server.
   *
   * The Photos panel and the background library place `images.unsplash.com`
   * addresses straight into a design, which is fine for an editor that keeps
   * its work in a browser and wrong for a planner: a design has to still look
   * like itself in a year, and Unsplash can change a URL or a key can be
   * revoked. Given this, a stock photograph is fetched into the host's own
   * store first and the design points at the copy.
   *
   * Only remote pictures go through it. An upload is already the host's, and a
   * sticker is markup rather than an address.
   *
   * Left out, nothing changes: the design points at Unsplash, as it always did.
   */
  importUrl?(url: string, meta: HostImportMeta): Promise<HostUpload>
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
  /**
   * Replaces the design on the canvas.
   *
   * By default this is a different design being opened: undo history starts
   * again from nothing, and the document becomes what "unsaved" is measured
   * against. With `resetHistory: false` it is a change to the design that is
   * open — one press of undo takes the whole swap back, and the design reads
   * as unsaved until it is saved.
   */
  setDocument(doc: DesignDocument, opts?: { resetHistory?: boolean }): void
  applyOps(ops: DesignOp[]): { applied: number; rejected: RejectedOp[] }
  exportPdf(): Promise<Blob>
  exportPptx(): Promise<Blob>
  /** `scale` 1 is the page's own pixel size. */
  exportPng(pageIndex: number, opts?: { scale?: number }): Promise<Blob>
  /**
   * Puts a page on the canvas. 0-based. A number off either end goes to the
   * first or the last page, and one that is not a whole number is rounded;
   * `NaN` goes to the first.
   */
  goToPage(index: number): void
  /** The 0-based index of the page on the canvas. */
  getCurrentPage(): number
  /** True when the design differs from the last save, the studio's or the host's. */
  isDirty(): boolean
  /**
   * Says the host has saved the design on its own account — outside the
   * studio's Save button: filling a blank, turning motion on, saving before an
   * AI refine, restoring an older version.
   *
   * `doc` is what the host saved; left out, it is the design on the canvas.
   * Either becomes what "unsaved" is measured against, so `isDirty()` is false
   * and the pill says Saved as long as the canvas matches it. Nothing is
   * redrawn and the undo history is kept, which is the difference from
   * `setDocument`. Undoing past the save makes the design unsaved again.
   *
   * Does nothing when the studio keeps the design itself, that is, when no
   * `document` was handed in.
   */
  markSaved(doc?: DesignDocument): void
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
  /**
   * Whether the host brought a panel of its own, shown behind an "AI" tab in
   * the rail. The panel itself is in `AssistantContext`, not here: see there.
   */
  hasAssistant: boolean
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
  hasAssistant: false,
  brandReadOnly: false,
  brandReadOnlyNote: BRAND_READ_ONLY_NOTE,
  handleRef: { current: null },
}

/** The host's answers, or the standalone editor's, which is what NONE is. */
export function useHostApi(): HostApi {
  return useContext(HostApiContext) ?? NONE
}

/**
 * The host's own panel, in a context of its own.
 *
 * A host passes it as inline JSX, which is a new object on every one of the
 * host's renders. Held in `HostApi`, it rebuilt the value every component in
 * the editor reads, so each keystroke in the planner's own fields re-rendered
 * the whole editor. Here only the slot that draws it is told.
 */
export const AssistantContext = createContext<ReactNode | null>(null)

export function useAssistant(): ReactNode | null {
  return useContext(AssistantContext)
}
