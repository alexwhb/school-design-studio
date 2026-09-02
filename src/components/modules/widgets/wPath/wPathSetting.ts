/**
 * What a path drawn with the pen starts out as.
 *
 * Two shapes come out of the one tool, and which one you get is decided by
 * where you stop drawing — the same as it is in Adobe XD. Run the path back to
 * the point you started from and it is a closed shape, so it arrives filled in
 * the placeholder grey every drawn shape arrives in, with no outline. Stop
 * anywhere else and it is a line, so it arrives with an outline to be a line
 * with and nothing inside it.
 *
 * Both are the same widget, and both keep both settings: a closed shape can be
 * given an outline, an open one can be filled — SVG closes an open path off
 * with a straight run to fill it, which is what XD shows too — and the panel's
 * own toggle moves a path between the two without touching either.
 */
import { SHAPE_DEFAULT_FILL, shapeSetting, type TShapeSetting } from '../shape/shapeSetting'
import type { TPathPoint } from './pathGeometry'

export type TWPathSetting = TShapeSetting & {
  /** Fractions of the frame; see pathGeometry.ts, which is the only thing that should read them. */
  points: TPathPoint[]
  closed: boolean
}

/** What a line is drawn with when nothing has said otherwise, in design pixels. */
export const PATH_STROKE_WIDTH = 2

/** Dark enough to read on a white page, light enough not to read as black ink. */
export const PATH_STROKE_COLOR = '#333333ff'

export const wPathSetting: TWPathSetting = {
  ...shapeSetting('Path', 'w-path'),
  points: [],
  closed: false,
  color: 'transparent',
  borderWidth: PATH_STROKE_WIDTH,
  borderColor: PATH_STROKE_COLOR,
}

/** The same widget as a closed shape: filled like every other drawn shape, and bare. */
export function closedPathSetting(): TWPathSetting {
  return { ...JSON.parse(JSON.stringify(wPathSetting)), closed: true, color: SHAPE_DEFAULT_FILL, borderWidth: 0 }
}

export function openPathSetting(): TWPathSetting {
  return JSON.parse(JSON.stringify(wPathSetting))
}
