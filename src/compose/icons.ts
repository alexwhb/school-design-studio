/**
 * The icons a sign may carry.
 *
 * The same library the Graphics panel offers, imported rather than fetched, so
 * a sign composed on a server carries a real piece of artwork and not a
 * reference to one. Each is a Lucide outline whose stroke is a `{{colors[0]}}`
 * placeholder, which is what lets it be painted in the school's colour as it
 * lands and repainted when the brand changes.
 *
 * A name nobody ships is dropped rather than guessed at: a sign with the wrong
 * picture on it is worse than a sign with none, and the layout leaves room
 * either way.
 */
import materials from '../../service/src/mock/materials/svg.json'
import { uuid } from './widgets'
import type { TdWidgetData } from '@/store/types'

type Material = { id: number; title: string; width: number; height: number; type: string; model: string; url: string }

const byKey = new Map<string, Material>()
for (const item of materials as Material[]) {
  if (item.type !== 'svg') continue
  byKey.set(item.title.toLowerCase(), item)
  // `graduation-cap` and `graduation cap` are the same picture, and a model
  // asked for an icon by name will spell it either way.
  byKey.set(item.title.toLowerCase().replace(/\s+/g, '-'), item)
  byKey.set(item.title.toLowerCase().replace(/\s+/g, ''), item)
}

/** Every icon name a sign may ask for, in the library's own order. */
export const ICON_KEYS = (materials as Material[]).filter((item) => item.type === 'svg').map((item) => item.title)

export function hasIcon(key: string | null | undefined): boolean {
  return !!key && byKey.has(String(key).trim().toLowerCase())
}

export function iconWidget(key: string, left: number, top: number, size: number, color: string): TdWidgetData | null {
  const found = byKey.get(String(key).trim().toLowerCase())
  if (!found) return null
  return {
    name: found.title,
    type: 'w-svg',
    uuid: uuid(),
    width: Math.round(size),
    height: Math.round(size),
    colors: [color],
    left: Math.round(left),
    top: Math.round(top),
    transform: '',
    radius: 0,
    opacity: 1,
    parent: '-1',
    svgUrl: found.url,
    imgUrl: found.url,
    setting: [],
    record: { width: 0, height: 0, minWidth: 10, minHeight: 10 },
  } as unknown as TdWidgetData
}
