/**
 * Page sizes in the units people actually think in.
 *
 * The editor stores a page in pixels and records nothing about how big it is
 * meant to be in the world, so every real-world size here is inferred at the
 * same 150 DPI the presets are built on and the PDF is written at — see
 * DESIGN_DPI in export/exportPdf.ts. One convention, in one place: a page that
 * says "A4" in this file is the page that comes out of the PDF as A4.
 */
import { DESIGN_DPI } from './export/dpi'

export type TSizeUnit = 'px' | 'in' | 'mm' | 'cm'

export const SIZE_UNITS: TSizeUnit[] = ['px', 'in', 'mm', 'cm']

/** Design pixels in one of each unit. */
const PX_PER_UNIT: Record<TSizeUnit, number> = {
  px: 1,
  in: DESIGN_DPI,
  mm: DESIGN_DPI / 25.4,
  cm: DESIGN_DPI / 2.54,
}

/**
 * Decimal places worth showing in each unit.
 *
 * Enough that a paper size reads as the number it is called by — A4 has to come
 * out as 210 × 297 mm and not 209.97 × 297.01 — and few enough that typing the
 * number back in returns the same page. A tenth of a millimetre is a sixth of a
 * design pixel, which is finer than anything the editor can draw.
 */
const PLACES: Record<TSizeUnit, number> = { px: 0, in: 2, mm: 1, cm: 2 }

/** A measurement in design pixels, shown in `unit` and rounded to suit it. */
export function fromPx(px: number, unit: TSizeUnit): number {
  const places = PLACES[unit]
  const factor = 10 ** places
  return Math.round(((Number(px) || 0) / PX_PER_UNIT[unit]) * factor) / factor
}

/** A measurement typed in `unit`, as the whole design pixels the store keeps. */
export function toPx(value: number, unit: TSizeUnit): number {
  return Math.round((Number(value) || 0) * PX_PER_UNIT[unit])
}

type TPaper = {
  name: string
  /** The short side then the long side, in millimetres. */
  mm: [number, number]
  /** Which units this paper is named in where it is used. */
  unit: 'mm' | 'in'
}

/**
 * The papers a school prints on. Listed short side first, so each one covers
 * both the portrait and the landscape design that sits on it.
 */
const PAPERS: TPaper[] = [
  { name: 'A3', mm: [297, 420], unit: 'mm' },
  { name: 'A4', mm: [210, 297], unit: 'mm' },
  { name: 'A5', mm: [148, 210], unit: 'mm' },
  { name: 'Letter', mm: [215.9, 279.4], unit: 'in' },
  { name: 'Legal', mm: [215.9, 355.6], unit: 'in' },
  { name: 'Tabloid', mm: [279.4, 431.8], unit: 'in' },
]

/**
 * How far out a page may be and still be called by a paper's name, in
 * millimetres. A preset is a whole number of pixels rather than an exact sheet
 * — A4 is stored as 1240 × 1754, which is a fifth of a millimetre short — and a
 * design someone typed a size into by hand should still be recognised.
 */
const PAPER_TOLERANCE = 1.5

/** The paper this page would print on, or null when it is not a sheet of anything. */
function matchPaper(widthPx: number, heightPx: number): TPaper | null {
  const width = fromPx(widthPx, 'mm')
  const height = fromPx(heightPx, 'mm')
  const short = Math.min(width, height)
  const long = Math.max(width, height)
  return PAPERS.find((item) => Math.abs(item.mm[0] - short) <= PAPER_TOLERANCE && Math.abs(item.mm[1] - long) <= PAPER_TOLERANCE) ?? null
}

/**
 * What this page would print on: "A4 portrait", "Letter landscape". Null when
 * it is not a sheet of anything, which is most screen sizes.
 */
export function paperName(widthPx: number, heightPx: number): string | null {
  const paper = matchPaper(widthPx, heightPx)
  if (!paper) return null
  // None of these sheets is square, so there is always an orientation to name.
  return `${paper.name} ${Number(heightPx) >= Number(widthPx) ? 'portrait' : 'landscape'}`
}

/**
 * The same page as a measurement: "210 × 297 mm", "8.5 × 11 in". Given in the
 * units the paper is named in where it is used, and in millimetres for anything
 * that is not a sheet of paper at all.
 */
export function realSize(widthPx: number, heightPx: number): string {
  const unit: TSizeUnit = matchPaper(widthPx, heightPx)?.unit === 'in' ? 'in' : 'mm'
  return `${fromPx(widthPx, unit)} × ${fromPx(heightPx, unit)} ${unit}`
}
