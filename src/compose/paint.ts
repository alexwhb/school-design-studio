/**
 * Whether a string is a colour, or a gradient made of colours, and nothing else.
 *
 * A design's colours go straight into CSS: a shape's `color` is its
 * `background`, a page's `backgroundGradient` is its `background-image`, a
 * shadow's colour is written inside `filter: drop-shadow(…)`. CSS will take a
 * picture anywhere it takes a paint, so `{"type":"w-rect","color":"url(/x)"}`
 * drew an image, and `url(data:image/svg+xml,…)` drew one from nowhere at all —
 * a picture the host's same-origin rule for URLs never saw, because it was not
 * in a URL field. A value that closes the declaration (`;`) or the rule (`}`)
 * could say more than that.
 *
 * So a paint is checked the way markup is: by saying what it may be, not what
 * it may not. A hex colour; `rgb()`, `rgba()`, `hsl()` or `hsla()` with numbers
 * in; a named colour or `transparent`; or a `linear-gradient()` or
 * `radial-gradient()` (repeating or not) built only from those, angles,
 * percentages and lengths, and the handful of words that say which way a
 * gradient runs. Anything else — `url(`, `image-set(`, `var(`, `expression(`,
 * a quote, a backslash, a semicolon, a brace — is not on the list, so it is not
 * a paint. No DOM: this runs in the compose entry, on a server.
 */

/**
 * CSS Color 4's named colours, lowercase, and three words that are not colours
 * but are what a design says for none: `transparent`, `currentcolor`, and
 * `none`, which is how an SVG shape asks for no fill at all.
 */
const NAMED = new Set(
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white whitesmoke yellow yellowgreen transparent currentcolor none'.split(
    ' ',
  ),
)

/** Longer than any colour or any gradient the picker writes, by a distance. */
const MAX_LENGTH = 2000

const NUMBER = '[-+]?(?:\\d+\\.?\\d*|\\.\\d+)(?:e[-+]?\\d+)?'
const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i
/** A colour function's arguments: numbers, with units a colour takes, and the separators. */
const COLOR_FUNCTION = new RegExp(`^(?:rgba?|hsla?)\\(\\s*${NUMBER}(?:%|deg|turn|rad|grad)?(?:\\s*[,/]?\\s*${NUMBER}%?){2,3}\\s*\\)$`, 'i')
const ANGLE = new RegExp(`^${NUMBER}(?:deg|turn|rad|grad)$`, 'i')
const LENGTH = new RegExp(`^${NUMBER}(?:%|px|em|rem)?$`, 'i')
const GRADIENT = /^(repeating-)?(linear|radial)-gradient\((.*)\)$/is
/** The words a gradient uses to say which way it runs, and what shape a radial is. */
const KEYWORDS = new Set(['to', 'at', 'left', 'right', 'top', 'bottom', 'center', 'circle', 'ellipse', 'closest-side', 'closest-corner', 'farthest-side', 'farthest-corner'])

/** A single colour: hex, a colour function of numbers, or a name. */
export function isSafeColor(value: string): boolean {
  const text = value.trim()
  if (!text || text.length > 200) return false
  if (HEX.test(text)) return true
  if (COLOR_FUNCTION.test(text)) return true
  return NAMED.has(text.toLowerCase())
}

/**
 * Splits on the commas at the top level only, leaving the ones inside `rgba(…)`
 * alone. Null when the brackets do not balance, which is never a paint.
 */
function splitTopLevel(body: string, separator: ',' | ' '): string[] | null {
  const parts: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < body.length; i++) {
    const char = body[i]
    if (char === '(') depth++
    else if (char === ')') {
      depth--
      if (depth < 0) return null
    } else if (depth === 0 && (separator === ',' ? char === ',' : /\s/.test(char))) {
      parts.push(body.slice(start, i))
      start = i + 1
    }
  }
  if (depth !== 0) return null
  parts.push(body.slice(start))
  const trimmed = parts.map((part) => part.trim())
  // Runs of spaces leave empty pieces, which mean nothing; an empty piece
  // between two commas is a missing argument, which the caller refuses.
  return separator === ' ' ? trimmed.filter(Boolean) : trimmed
}

/** One argument of a gradient: its direction or shape, or a colour stop. */
function isGradientArgument(argument: string): boolean {
  const tokens = splitTopLevel(argument, ' ')
  if (!tokens || tokens.length === 0) return false
  return tokens.every((token) => isSafeColor(token) || ANGLE.test(token) || LENGTH.test(token) || KEYWORDS.has(token.toLowerCase()))
}

function isSafeGradient(value: string): boolean {
  const match = GRADIENT.exec(value.trim())
  if (!match) return false
  const args = splitTopLevel(match[3], ',')
  // A gradient needs two stops at least; one argument is not a gradient.
  if (!args || args.length < 2 || args.some((argument) => !argument)) return false
  return args.every(isGradientArgument)
}

/**
 * Whether `value` may be painted: a colour, a gradient of colours, or a list of
 * gradients — nothing that can fetch, reference or say anything more.
 */
export function isSafePaint(value: string): boolean {
  if (typeof value !== 'string') return false
  const text = value.trim()
  if (!text || text.length > MAX_LENGTH) return false
  // Not needed for the answer — none of these fits the grammar below — but
  // said out loud so that nobody loosening the grammar lets one back in.
  if (/url\(|image-set|image\(|element\(|var\(|env\(|attr\(|expression|[;{}\\"'<>@!]|\/\*/i.test(text)) return false
  if (isSafeColor(text)) return true
  // A background can stack gradients, so a list of them is a paint too — as
  // long as every one of them is a gradient on its own.
  const layers = splitTopLevel(text, ',')
  return !!layers && layers.every(isSafeGradient)
}

/** A gradient's angle: a finite number of degrees, or nothing. */
export function isSafeAngle(value: unknown): boolean {
  return typeof value === 'number' ? Number.isFinite(value) : typeof value === 'string' && (ANGLE.test(value.trim()) || new RegExp(`^${NUMBER}$`).test(value.trim()))
}
