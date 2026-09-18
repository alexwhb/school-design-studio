/**
 * The brand kit: the school's identity, set once and used everywhere.
 *
 * A school office makes the same handful of things over and over — a notice, a
 * flyer, a slide deck — and every one of them carries the school's name, its
 * crest, its colours and its contact line. Without a kit those are retyped and
 * re-picked each time, and each time slightly differently. The kit holds them
 * once: the Brand panel edits it, templates fill their `{{school.*}}` fields
 * from it as they are added, the colour picker offers its colours, the font
 * list offers its fonts, and Apply brand pushes all of it onto a design that
 * was made before the kit existed.
 *
 * This file is where the kit is *kept*: the editor's live copy, and the row in
 * the browser's IndexedDB behind it. What a kit is and what its parts mean is
 * in `brandKitCore.ts`, which has no browser behind it and is re-exported here
 * whole — so an import of either name from this file still resolves.
 *
 * When the editor is embedded, the planner hands the kit in as a prop and is
 * told about every change, and nothing here touches the database. See
 * EMBEDDING.md.
 */
import { proxy } from 'valtio'
import { brandResolver as coreBrandResolver, emptyBrandKit, normaliseBrandKit, type TBrandKit } from './brandKitCore'
import type { TFieldResolver } from '@/utils/mergeFieldsCore'
import { run, STORES } from './localDb'

export * from './brandKitCore'

export const brandState = proxy<{ kit: TBrandKit; loaded: boolean; readOnly: boolean }>({ kit: emptyBrandKit(), loaded: false, readOnly: false })

/**
 * Whether the kit may be edited here.
 *
 * A school's brand belongs to the school, not to whoever happens to have a
 * design open, so a planner can hand the kit in for everyone to use and let
 * only an administrator change it. The panel greys itself out, but the answer
 * that matters is `updateBrandKit` below refusing: a guard at the one writer
 * cannot be got round by a control somebody forgot to disable.
 */
export function setBrandReadOnly(readOnly: boolean) {
  brandState.readOnly = readOnly
}

/**
 * Answers `school.*` fields, from the editor's live kit when no other is named.
 * The core's own `brandResolver` takes a kit outright, because nothing outside
 * a browser has a live one to fall back to.
 */
export function brandResolver(kit: TBrandKit = brandState.kit): TFieldResolver {
  return coreBrandResolver(kit)
}

// ---- persistence -----------------------------------------------------------

const RECORD_ID = 'kit'
/** Quiet time between an edit in the panel and the write, in ms. */
const SAVE_DEBOUNCE = 400

type TBrandRecord = TBrandKit & { id: string }

let hostManaged = false
let onHostChange: ((kit: TBrandKit) => void) | null = null
let saveTimer: ReturnType<typeof setTimeout> | undefined
let flushRegistered = false

/** A plain copy, free of the store's proxies, for the database and the host. */
export function snapshotBrandKit(): TBrandKit {
  return JSON.parse(JSON.stringify(brandState.kit))
}

/**
 * Reads the kit in, once, when the editor starts.
 *
 * With `initial` the host owns the kit: it is used as given, every later save
 * goes to `onChange` and the database is left alone. Without it the kit comes
 * from the browser, and a browser that has never had one gets an empty kit.
 * Never throws — a kit that cannot be read is an empty kit, not a dead editor.
 */
export async function loadBrandKit(initial?: TBrandKit, onChange?: (kit: TBrandKit) => void): Promise<void> {
  onHostChange = onChange ?? null
  hostManaged = !!initial
  if (!flushRegistered && typeof document !== 'undefined') {
    flushRegistered = true
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void flushBrandKit()
    })
  }
  if (initial) {
    brandState.kit = normaliseBrandKit(initial)
    brandState.loaded = true
    return
  }
  try {
    const record = await run<TBrandRecord | undefined>(STORES.brand, 'readonly', (store) => store.get(RECORD_ID) as IDBRequest<TBrandRecord | undefined>)
    if (record) brandState.kit = normaliseBrandKit(record)
  } catch (error) {
    console.error('[brand] could not read the brand kit', error)
  }
  brandState.loaded = true
}

/**
 * Takes a kit the host has changed since the editor mounted. Compared as JSON
 * first, because a host that builds the prop inline hands over a new object on
 * every render, and replacing the kit for each of those would throw away what
 * is being typed in the panel.
 */
export function adoptBrandKit(kit: TBrandKit) {
  const next = normaliseBrandKit(kit)
  if (JSON.stringify(next) === JSON.stringify(snapshotBrandKit())) return
  brandState.kit = next
}

/** Writes the kit down now. Resolves false when the browser would not take it. */
export async function saveBrandKit(): Promise<boolean> {
  clearTimeout(saveTimer)
  saveTimer = undefined
  const kit = snapshotBrandKit()
  onHostChange?.(kit)
  if (hostManaged) return true
  try {
    await run(STORES.brand, 'readwrite', (store) => store.put({ id: RECORD_ID, ...kit } satisfies TBrandRecord) as IDBRequest<any>)
    return true
  } catch (error) {
    console.error('[brand] could not save the brand kit', error)
    return false
  }
}

/** Writes anything still waiting, which a tab about to be hidden should. */
export function flushBrandKit(): Promise<boolean> {
  if (!saveTimer) return Promise.resolve(true)
  return saveBrandKit()
}

/**
 * Changes the kit and schedules the write. Every edit in the panel goes
 * through here so that typing a name is one write rather than one per letter.
 */
export function updateBrandKit(change: (kit: TBrandKit) => void) {
  // The one door into the kit, so it is the one place worth guarding. Silent
  // rather than thrown: nothing should be calling this while the panel is read
  // only, and a throw would take a click handler down with it.
  if (brandState.readOnly) return
  change(brandState.kit)
  clearTimeout(saveTimer)
  saveTimer = setTimeout(() => void saveBrandKit(), SAVE_DEBOUNCE)
}
