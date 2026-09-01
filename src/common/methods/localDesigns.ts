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
 * next visit. One design, because the editor has one canvas and no way to
 * browse a library; a real deployment wants designs keyed by school and user,
 * and this is the seam for it — keep the four functions, change what is inside
 * them.
 *
 * It is stored a page at a time rather than whole. A design may run to
 * MAX_PAGES, and a fifty-page deck of photographs is tens of megabytes; writing
 * all of it every couple of seconds because someone typed a letter on page one
 * meant the browser structured-cloning the other forty-nine pages for nothing.
 * The meta row carries the title and the page count, `designPages` carries the
 * artwork, and a save touches only the pages the caller says have changed.
 */
import { run, runBatch, STORES } from './localDb'
import type { TdLayout } from '@/store/types'

/** The autosaved draft's fixed key. One canvas, one design. */
const DRAFT_ID = 'draft'
/** Its pages are `draft:0`, `draft:1`, … in the designPages store. */
const PAGE_PREFIX = `${DRAFT_ID}:`

const pageKey = (index: number) => `${PAGE_PREFIX}${index}`
/** Every page of this draft and nothing else. */
const pageRange = () => IDBKeyRange.bound(PAGE_PREFIX, `${PAGE_PREFIX}￿`)

export type LocalDesign = {
  id: string
  title: string
  /** Every page, exactly as the widget store holds them. */
  layouts: TdLayout[]
  /** ISO timestamp of the last write. */
  savedAt: string
}

/** A page the caller has decided is different from what is stored. */
export type ChangedPage = { index: number; layout: TdLayout }

type DraftMeta = {
  id: string
  title: string
  pageCount: number
  savedAt: string
  /** Only on drafts written before pages were stored separately. */
  layouts?: TdLayout[]
}

type DraftPage = { id: string; index: number; layout: TdLayout }

export async function readDraft(): Promise<LocalDesign | null> {
  try {
    const meta = await run<DraftMeta | undefined>(STORES.designs, 'readonly', (store) => store.get(DRAFT_ID) as IDBRequest<DraftMeta | undefined>)
    if (!meta) return null

    // A draft saved by an older build holds every page in the meta row. Hand it
    // back as it is — the next save splits it up and drops the `layouts` field.
    const layouts = Array.isArray(meta.layouts) ? meta.layouts : await readPages()

    // A draft with no pages is not worth offering to restore.
    return layouts.length ? { id: DRAFT_ID, title: meta.title, layouts, savedAt: meta.savedAt } : null
  } catch (error) {
    console.error('[designs] could not read the saved design', error)
    return null
  }
}

async function readPages(): Promise<TdLayout[]> {
  const pages = await run<DraftPage[]>(STORES.designPages, 'readonly', (store) => store.getAll(pageRange()) as IDBRequest<DraftPage[]>)
  // Keys sort as text, where `draft:10` comes before `draft:2`, so the page
  // number is carried in the record and the order comes from that.
  return pages.sort((a, b) => a.index - b.index).map((page) => page.layout)
}

/**
 * Writes the title, the page count, and the pages that changed.
 *
 * `changed` must be plain data, not the widget store's own objects: IndexedDB
 * structured-clones what it is given, and the valtio store carries reactive
 * proxies that clone rejects with DataCloneError. The caller has usually just
 * been through JSON to decide which pages moved, so it holds plain copies
 * already and cloning again here would only double the work.
 *
 * `pageCount` is the whole design's length, not `changed`'s: pages past it are
 * deleted, which is how a design that lost its last page stops being restored
 * with it still attached.
 */
export async function saveDraft(title: string, changed: ChangedPage[], pageCount: number): Promise<boolean> {
  const meta: DraftMeta = { id: DRAFT_ID, title, pageCount, savedAt: new Date().toISOString() }
  try {
    await runBatch([STORES.designs, STORES.designPages], 'readwrite', (store) => {
      const designs = store(STORES.designs)
      const pages = store(STORES.designPages)

      // Putting the meta row is also the migration off the old whole-design
      // format: the record it replaces carried `layouts` and this one does not.
      designs.put(meta)
      for (const { index, layout } of changed) {
        pages.put({ id: pageKey(index), index, layout } satisfies DraftPage)
      }

      // Pages the design no longer has. A key cursor rather than a value one:
      // it never loads the artwork it is about to throw away.
      const cursorRequest = pages.openKeyCursor(pageRange())
      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result
        if (!cursor) return
        const index = Number(String(cursor.key).slice(PAGE_PREFIX.length))
        if (!(index < pageCount)) pages.delete(cursor.key)
        cursor.continue()
      }
    })
    return true
  } catch (error) {
    // Quota is the one that will actually happen: a design full of pasted
    // photos can run to tens of megabytes. Report it, don't throw into a watcher.
    console.error('[designs] could not save the design', error)
    return false
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await runBatch([STORES.designs, STORES.designPages], 'readwrite', (store) => {
      store(STORES.designs).delete(DRAFT_ID)
      store(STORES.designPages).delete(pageRange())
    })
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
