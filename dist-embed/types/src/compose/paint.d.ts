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
/** A single colour: hex, a colour function of numbers, or a name. */
export declare function isSafeColor(value: string): boolean;
/**
 * Whether `value` may be painted: a colour, a gradient of colours, or a list of
 * gradients — nothing that can fetch, reference or say anything more.
 */
export declare function isSafePaint(value: string): boolean;
/** A gradient's angle: a finite number of degrees, or nothing. */
export declare function isSafeAngle(value: unknown): boolean;
