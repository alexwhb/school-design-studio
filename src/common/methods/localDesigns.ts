/**
 * Where the design being worked on is kept.
 *
 * Nothing kept a design before this. File → Save called saveTemp(), which
 * returns immediately unless the URL carries ?tempid, so for anyone who had not
 * opened a template by id the menu item did nothing at all — no error, no
 * saved file. A reload then threw the work away, guarded only by the browser's
 * "leave site?" prompt, which is switched off in dev. Twenty minutes of work
 * could go on one stray Cmd-R.
 *
 * So the design is written to the browser as it changes, and read back on the
 * next visit. One row, because the editor has one canvas and no way to browse a
 * library; a real deployment wants designs keyed by school and user, and this
 * is the seam for it — keep the four functions, change what is inside them.
 */
import { run, STORES } from './localDb'
import type { TdLayout } from '@/store/design/widget'

/** The autosaved draft's fixed key. One canvas, one row. */
const DRAFT_ID = 'draft'

export type LocalDesign = {
  id: string
  title: string
  /** Every page, exactly as the widget store holds them. */
  layouts: TdLayout[]
  /** ISO timestamp of the last write. */
  savedAt: string
}

export async function readDraft(): Promise<LocalDesign | null> {
  try {
    const found = await run<LocalDesign | undefined>(STORES.designs, 'readonly', (store) => store.get(DRAFT_ID) as IDBRequest<LocalDesign | undefined>)
    // A draft with no pages is not worth offering to restore.
    return found?.layouts?.length ? found : null
  } catch (error) {
    console.error('[designs] could not read the saved design', error)
    return null
  }
}

/**
 * Writes the draft, replacing whatever was there.
 *
 * `layouts` must be plain data, not the widget store's own array: IndexedDB
 * structured-clones what it is given, and a Pinia state object carries reactive
 * proxies that clone rejects with DataCloneError. The caller has usually just
 * been through JSON to decide whether anything changed, so it holds a plain
 * copy already and cloning again here would only double the work on a design
 * full of photographs.
 */
export async function saveDraft(title: string, layouts: TdLayout[]): Promise<LocalDesign | null> {
  const record: LocalDesign = {
    id: DRAFT_ID,
    title,
    layouts,
    savedAt: new Date().toISOString(),
  }
  try {
    await run(STORES.designs, 'readwrite', (store) => store.put(record) as IDBRequest<any>)
    return record
  } catch (error) {
    // Quota is the one that will actually happen: a design full of pasted
    // photos can run to tens of megabytes. Report it, don't throw into a watcher.
    console.error('[designs] could not save the design', error)
    return null
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await run(STORES.designs, 'readwrite', (store) => store.delete(DRAFT_ID) as IDBRequest<any>)
  } catch (error) {
    console.error('[designs] could not clear the saved design', error)
  }
}

/** "2 minutes ago", for telling someone how old the design we found is. */
export function describeAge(iso: string): string {
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000))
  if (seconds < 90) return 'a moment ago'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} minutes ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`
  const days = Math.round(hours / 24)
  return days === 1 ? 'yesterday' : `${days} days ago`
}
