/**
 * Signs and posters from an outline.
 *
 * A sign is read at a distance and in a hurry — a parent in a corridor looking
 * for the gym, a queue outside a book fair — so every one of these layouts puts
 * one thing very large and everything else out of its way. The five differ in
 * what that one thing is: a place, a picture, a sentence, a number, or a notice
 * that has to be read rather than glanced at.
 *
 * Sizes are fractions of the page rather than pixels, so the same five layouts
 * hold on Letter, on tabloid, on a banner and on any of them turned sideways.
 */
import type { ComposeOptions, DesignDocument, PosterOutline, PosterSign } from './types'
import type { Theme } from './themes'
import { posterPack } from './themes'
import { fitText, heightOf } from './textFit'
import { hasIcon, iconWidget } from './icons'
import { markup, page, rectWidget, textWidget } from './widgets'
import { applyBrand, fieldFiller } from './brand'
import type { TdLayout, TdWidgetData } from '@/store/types'

/**
 * The paper a sign can be printed on, portrait, in design pixels at 150 DPI.
 */
const SIZES: Record<'letter' | 'tabloid' | 'banner', { width: number; height: number }> = {
  letter: { width: 1275, height: 1650 },
  tabloid: { width: 1650, height: 2550 },
  // A roll-up banner: 24 × 72 inches, the size a school already owns a stand for.
  banner: { width: 3600, height: 10800 },
}

/**
 * A size name that carries its own orientation, and what it means.
 *
 * The planner stores `letter-landscape`; this has always taken the way round
 * separately. Rather than make one of them convert, both spellings are read,
 * and a name that says which way round it is settles it — somebody who wrote
 * `letter-portrait` meant portrait, whatever else the outline says.
 */
const FIXED: Record<string, { size: 'letter' | 'tabloid' | 'banner'; landscape: boolean }> = {
  'letter-landscape': { size: 'letter', landscape: true },
  'letter-portrait': { size: 'letter', landscape: false },
}

export const SIGN_PAGE_KINDS: PosterSign['layout'][] = ['direction', 'icon', 'statement', 'number', 'notice']

export function blankSign(layout: PosterSign['layout']): PosterSign {
  return { layout, icon: null, eyebrow: null, badge: null, head: '', sub: null, foot: null }
}

export function pageSize(outline: Pick<PosterOutline, 'orientation' | 'size'>): { width: number; height: number } {
  const fixed = FIXED[String(outline?.size)]
  const base = SIZES[fixed ? fixed.size : (outline?.size as 'letter' | 'tabloid' | 'banner')] || SIZES.letter
  const landscape = fixed ? fixed.landscape : outline?.orientation === 'LANDSCAPE'
  return landscape ? { width: base.height, height: base.width } : { ...base }
}

type Frame = { W: number; H: number; M: number; content: number }

function frameOf(width: number, height: number): Frame {
  const M = Math.round(Math.min(width, height) * 0.09)
  return { W: width, H: height, M, content: width - M * 2 }
}

type Style = {
  font: Theme['display']
  size: number
  minSize: number
  lineHeight: number
  color: string
  weight?: number
  tracking?: number
  align?: 'left' | 'center' | 'right'
  brandRole?: 'heading' | 'body' | 'keep'
  role?: string
  maxLines?: number
}

function place(text: string | null | undefined, box: { left: number; top: number; width: number; height: number }, style: Style) {
  const words = String(text || '').trim()
  if (!words) return null
  const fit = fitText(words, { fontFamily: style.font.value, fontSize: style.size, lineHeight: style.lineHeight, letterSpacing: style.tracking, bold: (style.weight || 400) >= 600 }, { width: box.width, height: box.height, minFontSize: style.minSize, maxLines: style.maxLines })
  if (!fit.lines.length) return null
  const height = heightOf(fit, style.lineHeight)
  return {
    widget: textWidget({
      left: box.left,
      top: box.top,
      width: box.width,
      height,
      fontSize: fit.fontSize,
      lineHeight: style.lineHeight,
      letterSpacing: style.tracking ? Math.round(style.tracking * (fit.fontSize / style.size)) : 0,
      color: style.color,
      font: style.font,
      fontWeight: style.weight,
      textAlign: style.align ?? 'center',
      brandRole: style.brandRole,
      role: style.role,
      text: markup(fit.lines.join('\n')),
    }),
    bottom: box.top + height,
  }
}

/** Fills a `{{school.*}}` line before it is measured. See `fieldFiller`. */
type Fill = (text: string) => string

/** The band across the top, and the school's line along the bottom. */
function furniture(theme: Theme, frame: Frame, sign: PosterSign, onDark: boolean, fill: Fill): TdWidgetData[] {
  const { W, H, M, content } = frame
  const layers: TdWidgetData[] = []
  const soft = onDark ? theme.paper : theme.muted

  const browTop = Math.round(H * 0.07)
  const brow = place(
    sign.eyebrow ? sign.eyebrow.toUpperCase() : null,
    { left: M, top: browTop, width: content, height: Math.round(H * 0.05) },
    {
      font: theme.eyebrow,
      size: Math.round(W * 0.028),
      minSize: Math.round(W * 0.016),
      lineHeight: 1.3,
      tracking: theme.eyebrowTracking,
      color: onDark ? theme.paper : theme.accent,
      brandRole: 'keep',
      role: 'eyebrow',
      maxLines: 1,
    },
  )
  if (brow) layers.push(brow.widget)

  const footTop = Math.round(H * 0.9)
  layers.push(rectWidget(M, footTop, content, 3, onDark ? theme.paper : theme.rule))
  const foot = place(
    fill(sign.foot || '{{school.name}} · {{school.phone}}'),
    { left: M, top: footTop + Math.round(H * 0.018), width: content, height: Math.round(H * 0.05) },
    {
      font: theme.eyebrow,
      size: Math.round(W * 0.024),
      minSize: Math.round(W * 0.015),
      lineHeight: 1.35,
      color: soft,
      brandRole: 'keep',
      role: 'footer',
      maxLines: 2,
    },
  )
  if (foot) layers.push(foot.widget)
  return layers
}

function headBox(frame: Frame, top: number, height: number) {
  return { left: frame.M, top: Math.round(top), width: frame.content, height: Math.round(height) }
}

function directionSign(theme: Theme, frame: Frame, sign: PosterSign, fill: Fill): { layers: TdWidgetData[]; background: string } {
  const { W, H, M, content } = frame
  const layers: TdWidgetData[] = []
  layers.push(rectWidget(0, 0, W, Math.round(H * 0.055), theme.accent))

  const head = place(sign.head, headBox(frame, H * 0.2, H * 0.34), {
    font: theme.display,
    size: Math.round(W * 0.19),
    minSize: Math.round(W * 0.07),
    lineHeight: 1.02,
    color: theme.ink,
    weight: theme.displayWeight,
    brandRole: 'heading',
    role: 'heading',
  })
  let top = Math.round(H * 0.56)
  if (head) {
    layers.push(head.widget)
    top = head.bottom + Math.round(H * 0.035)
  }

  const arrow = iconWidget('arrow right', M + Math.round((content - W * 0.22) / 2), top, Math.round(W * 0.22), theme.accent)
  if (arrow) {
    layers.push(arrow)
    top += Math.round(W * 0.22) + Math.round(H * 0.02)
  }

  const sub = place(sign.sub, headBox(frame, top, H * 0.86 - top), {
    font: theme.body,
    size: Math.round(W * 0.05),
    minSize: Math.round(W * 0.028),
    lineHeight: 1.3,
    color: theme.muted,
    brandRole: 'body',
    role: 'body',
  })
  if (sub) layers.push(sub.widget)
  return { layers: [...layers, ...furniture(theme, frame, sign, false, fill)], background: theme.paper }
}

function iconSign(theme: Theme, frame: Frame, sign: PosterSign, fill: Fill): { layers: TdWidgetData[]; background: string } {
  const { W, H, M, content } = frame
  const layers: TdWidgetData[] = []
  const size = Math.round(W * 0.34)
  let top = Math.round(H * 0.17)

  const icon = hasIcon(sign.icon) ? iconWidget(sign.icon as string, M + Math.round((content - size) / 2), top, size, theme.accent) : null
  if (icon) {
    layers.push(icon)
    top += size + Math.round(H * 0.04)
  }

  const head = place(sign.head, headBox(frame, top, H * 0.28), {
    font: theme.display,
    size: Math.round(W * 0.14),
    minSize: Math.round(W * 0.06),
    lineHeight: 1.04,
    color: theme.ink,
    weight: theme.displayWeight,
    brandRole: 'heading',
    role: 'heading',
  })
  if (head) {
    layers.push(head.widget)
    top = head.bottom + Math.round(H * 0.03)
  }

  const sub = place(sign.sub, headBox(frame, top, H * 0.86 - top), {
    font: theme.body,
    size: Math.round(W * 0.045),
    minSize: Math.round(W * 0.026),
    lineHeight: 1.35,
    color: theme.muted,
    brandRole: 'body',
    role: 'body',
  })
  if (sub) layers.push(sub.widget)
  return { layers: [...layers, ...furniture(theme, frame, sign, false, fill)], background: theme.paper }
}

/** The one that is set on the school's colour rather than on paper. */
function statementSign(theme: Theme, frame: Frame, sign: PosterSign, fill: Fill): { layers: TdWidgetData[]; background: string } {
  const { W, H } = frame
  const layers: TdWidgetData[] = []

  const head = place(sign.head, headBox(frame, H * 0.24, H * 0.4), {
    font: theme.display,
    size: Math.round(W * 0.13),
    minSize: Math.round(W * 0.05),
    lineHeight: 1.08,
    color: theme.paper,
    weight: theme.displayWeight,
    brandRole: 'heading',
    role: 'heading',
  })
  let top = Math.round(H * 0.66)
  if (head) {
    layers.push(head.widget)
    top = head.bottom + Math.round(H * 0.035)
  }
  const sub = place(sign.sub, headBox(frame, top, H * 0.86 - top), {
    font: theme.body,
    size: Math.round(W * 0.042),
    minSize: Math.round(W * 0.026),
    lineHeight: 1.4,
    color: theme.paper,
    brandRole: 'body',
    role: 'body',
  })
  if (sub) layers.push(sub.widget)
  return { layers: [...layers, ...furniture(theme, frame, sign, true, fill)], background: theme.accent }
}

function numberSign(theme: Theme, frame: Frame, sign: PosterSign, fill: Fill): { layers: TdWidgetData[]; background: string } {
  const { W, H, M, content } = frame
  const layers: TdWidgetData[] = []

  const badge = place(sign.badge || sign.head, headBox(frame, H * 0.19, H * 0.3), {
    font: theme.display,
    size: Math.round(W * 0.4),
    minSize: Math.round(W * 0.1),
    lineHeight: 1,
    color: theme.accent,
    weight: theme.displayWeight,
    brandRole: 'heading',
    role: 'number',
    maxLines: 1,
  })
  let top = Math.round(H * 0.5)
  if (badge) {
    layers.push(badge.widget)
    top = badge.bottom + Math.round(H * 0.03)
  }
  layers.push(rectWidget(M + Math.round(content * 0.35), top, Math.round(content * 0.3), 6, theme.rule))
  top += Math.round(H * 0.035)

  const head = place(sign.badge ? sign.head : sign.sub, headBox(frame, top, H * 0.2), {
    font: theme.display,
    size: Math.round(W * 0.09),
    minSize: Math.round(W * 0.04),
    lineHeight: 1.1,
    color: theme.ink,
    weight: theme.displayWeight,
    brandRole: 'heading',
    role: 'heading',
  })
  if (head) {
    layers.push(head.widget)
    top = head.bottom + Math.round(H * 0.025)
  }
  const sub = place(sign.badge ? sign.sub : null, headBox(frame, top, H * 0.86 - top), {
    font: theme.body,
    size: Math.round(W * 0.04),
    minSize: Math.round(W * 0.025),
    lineHeight: 1.35,
    color: theme.muted,
    brandRole: 'body',
    role: 'body',
  })
  if (sub) layers.push(sub.widget)
  return { layers: [...layers, ...furniture(theme, frame, sign, false, fill)], background: theme.paper }
}

/** The one meant to be read standing still: left-aligned, and room for prose. */
function noticeSign(theme: Theme, frame: Frame, sign: PosterSign, fill: Fill): { layers: TdWidgetData[]; background: string } {
  const { W, H, M, content } = frame
  const layers: TdWidgetData[] = []
  layers.push(rectWidget(M, Math.round(H * 0.135), Math.round(content * 0.18), 10, theme.accent))

  const head = place(sign.head, headBox(frame, H * 0.18, H * 0.26), {
    font: theme.display,
    size: Math.round(W * 0.11),
    minSize: Math.round(W * 0.05),
    lineHeight: 1.06,
    color: theme.ink,
    weight: theme.displayWeight,
    align: 'left',
    brandRole: 'heading',
    role: 'heading',
  })
  let top = Math.round(H * 0.46)
  if (head) {
    layers.push(head.widget)
    top = head.bottom + Math.round(H * 0.03)
  }

  const icon = hasIcon(sign.icon) ? iconWidget(sign.icon as string, frame.W - M - Math.round(W * 0.14), Math.round(H * 0.17), Math.round(W * 0.14), theme.accentSoft) : null
  if (icon) layers.push(icon)

  const sub = place(sign.sub, headBox(frame, top, H * 0.86 - top), {
    font: theme.body,
    size: Math.round(W * 0.04),
    minSize: Math.round(W * 0.024),
    lineHeight: 1.5,
    color: theme.ink,
    align: 'left',
    brandRole: 'body',
    role: 'body',
  })
  if (sub) layers.push(sub.widget)
  return { layers: [...layers, ...furniture(theme, frame, sign, false, fill)], background: theme.paper }
}

const LAYOUTS: Record<PosterSign['layout'], (theme: Theme, frame: Frame, sign: PosterSign, fill: Fill) => { layers: TdWidgetData[]; background: string }> = {
  direction: directionSign,
  icon: iconSign,
  statement: statementSign,
  number: numberSign,
  notice: noticeSign,
}

/** One sign, as a page. Exported so `addPage` can make one. */
export function composeSign(sign: PosterSign, theme: Theme, size: { width: number; height: number }, fill: Fill = (text) => text): TdLayout {
  const frame = frameOf(size.width, size.height)
  const draw = LAYOUTS[sign.layout] || noticeSign
  const { layers, background } = draw(theme, frame, sign, fill)
  const name = sign.head?.trim() || sign.eyebrow?.trim() || 'Sign'
  return { global: page(name.slice(0, 60), size.width, size.height, background), layers }
}

export function composePoster(outline: PosterOutline, options: ComposeOptions = {}): DesignDocument {
  const theme = posterPack(options.theme)
  const fill = fieldFiller(options.brand)
  const size = pageSize(outline || { orientation: 'PORTRAIT', size: 'letter' })
  const signs = Array.isArray(outline?.signs) ? outline.signs : []
  const layouts = (signs.length ? signs : [blankSign('notice')]).map((sign) => composeSign({ ...blankSign(sign?.layout || 'notice'), ...sign }, theme, size, fill))
  const doc: DesignDocument = { format: 'design-studio/v1', title: signs[0]?.head?.trim() || 'Untitled sign', layouts }
  return options.brand ? applyBrand(doc, options.brand) : doc
}
