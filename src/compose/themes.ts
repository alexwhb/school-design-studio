/**
 * The look a composed design comes out in, read off the studio's own artwork.
 *
 * The editor already ships five slide themes and a pack of school-event
 * posters, each drawn by hand: a paper colour, an ink, a soft second ink, one
 * accent, a hairline, and the two or three families that go together. Writing
 * those numbers out again here would mean two sets of them, and the second set
 * would be the one that drifted. So the artwork is imported and the numbers are
 * read out of it — the theme's own cover slide, and one poster per pack.
 *
 * What is read: the page's paper colour, the accent the template's own `brand`
 * block names as primary, and then the inks and the hairline picked by contrast
 * against that paper rather than by position, so the same rule works on the
 * light themes and on the dark one. Fonts come from the layers that use them:
 * the biggest line is the display face, the widest body line is the body face,
 * and a small tracked-out line is the eyebrow face.
 *
 * Only the eight files below are bundled, not the whole gallery — a theme is
 * about twenty numbers, and importing all fifty-two templates to find them
 * would put three quarters of a megabyte of somebody else's artwork into a
 * module whose job is to lay out yours.
 */
import { contrastRatio } from '@/common/methods/contrast'
import type { TdWidgetData } from '@/store/types'
import editorial from '../../service/src/mock/templates/201.json'
import swiss from '../../service/src/mock/templates/206.json'
import academic from '../../service/src/mock/templates/211.json'
import dark from '../../service/src/mock/templates/216.json'
import pastel from '../../service/src/mock/templates/221.json'
import navy from '../../service/src/mock/templates/101.json'
import crimson from '../../service/src/mock/templates/104.json'
import forest from '../../service/src/mock/templates/107.json'

/** The slide themes the studio ships, by the name a caller passes as `theme`. */
export const SLIDE_THEME_KEYS = ['editorial', 'swiss', 'academic', 'dark', 'pastel'] as const
export type SlideThemeKey = (typeof SLIDE_THEME_KEYS)[number]

/**
 * The poster packs, named for the colour each is built on. All three come out
 * of the school-events pack, which is one identity in three palettes.
 */
export const POSTER_PACK_KEYS = ['navy', 'crimson', 'forest'] as const
export type PosterPackKey = (typeof POSTER_PACK_KEYS)[number]

export type FontChoice = {
  alias: string
  id: number
  url: string
  value: string
}

export type Theme = {
  key: string
  /** The page's own colour. */
  paper: string
  /** Words, at full strength. */
  ink: string
  /** Words that are not the point of the page. */
  muted: string
  /** The one colour that is the school's, and the first thing a brand kit takes over. */
  accent: string
  /** A second accent when the theme has one, otherwise the same as `accent`. */
  accentSoft: string
  /** Hairlines and dividers. */
  rule: string
  display: FontChoice
  body: FontChoice
  eyebrow: FontChoice
  /** How the display face is set on this theme. */
  displayWeight: number
  displayLineHeight: number
  displayTracking: number
  /** How far an eyebrow is tracked out, at 24px. */
  eyebrowTracking: number
}

type TemplateFile = { id: string; title: string; brand?: { colors?: Record<string, string> }; data: string }

function pageOf(file: TemplateFile): { background: string; layers: TdWidgetData[] } {
  const parsed = JSON.parse(file.data)
  const first = Array.isArray(parsed) ? parsed[0] : { global: parsed.page, layers: parsed.widgets }
  return { background: String(first.global?.backgroundColor || '#ffffffff'), layers: (first.layers || []) as TdWidgetData[] }
}

const opaque = (color: unknown): string | null => {
  const value = String(color || '')
  return /^#[0-9a-f]{6}(ff)?$/i.test(value) ? `${value.slice(0, 7).toLowerCase()}ff` : null
}

function fontOf(layer: TdWidgetData | undefined, fallback: FontChoice): FontChoice {
  const chosen = layer?.fontClass as FontChoice | undefined
  if (!chosen?.value) return fallback
  return { alias: chosen.alias || chosen.value, id: Number(chosen.id) || 0, url: chosen.url || '', value: chosen.value }
}

const INTER: FontChoice = { alias: 'Inter', id: 1, url: '/fonts/inter-400-700.woff2', value: 'Inter' }

/** The role a template's own `brand` block gives one of its colours. */
function roleColor(file: TemplateFile, role: string): string | null {
  for (const [hex, named] of Object.entries(file.brand?.colors || {})) {
    if (String(named).toLowerCase() === role) return opaque(`#${String(hex).replace(/^#/, '')}`)
  }
  return null
}

/**
 * Reads one theme out of one template.
 *
 * Everything is chosen by contrast against the paper rather than by where it
 * sits in the file, which is what lets the same twenty lines read the dark
 * theme and the cream one without a special case for either.
 */
function readTheme(key: string, file: TemplateFile): Theme {
  const { background, layers } = pageOf(file)
  const paper = opaque(background) || '#ffffffff'
  const accent = roleColor(file, 'primary') || '#1e3a5fff'
  const accentSoft = roleColor(file, 'secondary') || accent

  const texts = layers.filter((layer) => layer.type === 'w-text')
  const against = (color: string) => contrastRatio(color, paper)

  // Ink is the strongest thing written on this paper; muted is the strongest
  // of what is left, which is how a theme's second grey is found without
  // naming it. The accent is excluded from both — it is the school's colour,
  // and a brand kit is going to replace it.
  const inks = [...new Set(texts.map((layer) => opaque((layer as any).color)).filter((color): color is string => !!color))].filter((color) => color !== accent && color !== accentSoft).sort((a, b) => against(b) - against(a))
  const ink = inks[0] || '#111111ff'
  const muted = inks.find((color) => color !== ink && against(color) >= 3) || inks[1] || ink

  // A hairline is the faintest thing on the page that is still visible: the
  // lowest contrast among the shapes' opaque colours that is not the paper.
  const rules = layers
    .filter((layer) => layer.type === 'w-svg')
    .flatMap((layer) => ((layer as any).colors || []) as unknown[])
    .map(opaque)
    .filter((color): color is string => !!color && against(color) > 1.08)
    .sort((a, b) => against(a) - against(b))

  const biggest = [...texts].sort((a, b) => Number((b as any).fontSize) - Number((a as any).fontSize))[0]
  const bodyLayer = texts.filter((layer) => layer.brandRole === 'body').sort((a, b) => b.width - a.width)[0]
  const eyebrowLayer = texts.find((layer) => Number((layer as any).fontSize) <= 28 && Number((layer as any).letterSpacing) >= 6)

  return {
    key,
    paper,
    ink,
    muted,
    accent,
    accentSoft,
    rule: rules[0] || muted,
    display: fontOf(biggest, INTER),
    body: fontOf(bodyLayer, INTER),
    eyebrow: fontOf(eyebrowLayer, INTER),
    displayWeight: Number((biggest as any)?.fontWeight) || 400,
    displayLineHeight: Number((biggest as any)?.lineHeight) || 1.05,
    displayTracking: Number((biggest as any)?.letterSpacing) || 0,
    eyebrowTracking: Number((eyebrowLayer as any)?.letterSpacing) || 8,
  }
}

const SLIDE_SOURCES: Record<SlideThemeKey, TemplateFile> = {
  editorial: editorial as TemplateFile,
  swiss: swiss as TemplateFile,
  academic: academic as TemplateFile,
  dark: dark as TemplateFile,
  pastel: pastel as TemplateFile,
}

const POSTER_SOURCES: Record<PosterPackKey, TemplateFile> = {
  navy: navy as TemplateFile,
  crimson: crimson as TemplateFile,
  forest: forest as TemplateFile,
}

const slideThemes = new Map<string, Theme>()
const posterPacks = new Map<string, Theme>()

/** Read once, on the first ask. A theme is the same every time it is read. */
export function slideTheme(key: string | undefined): Theme {
  const name = (SLIDE_THEME_KEYS as readonly string[]).includes(String(key)) ? (key as SlideThemeKey) : 'editorial'
  if (!slideThemes.has(name)) slideThemes.set(name, readTheme(name, SLIDE_SOURCES[name]))
  return slideThemes.get(name) as Theme
}

export function posterPack(key: string | undefined): Theme {
  const name = (POSTER_PACK_KEYS as readonly string[]).includes(String(key)) ? (key as PosterPackKey) : 'navy'
  if (!posterPacks.has(name)) posterPacks.set(name, readTheme(name, POSTER_SOURCES[name]))
  return posterPacks.get(name) as Theme
}
