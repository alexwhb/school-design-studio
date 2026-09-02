/**
 * The export quality the person last chose, shared between the Export menu and
 * anything else that renders through the same pipeline.
 *
 * It used to be state local to the Export menu, which was fine while the menu
 * was the only place a render started from. Bulk documents draw hundreds of
 * pages through the same renderer and should come out at the quality already
 * chosen, rather than asking the question a second time in a second place.
 */
import { proxy } from 'valtio'
import type { ExportScale } from './exportPdf'

export const exportQuality = proxy<{ scale: ExportScale }>({ scale: 1 })

export function setExportScale(scale: ExportScale) {
  exportQuality.scale = scale
}
