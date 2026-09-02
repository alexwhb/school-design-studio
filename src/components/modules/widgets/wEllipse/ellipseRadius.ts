/**
 * What makes an ellipse an ellipse: a corner radius of half its own width and
 * half its own height, which is what a bare `50%` means to `border-radius`.
 *
 * A proportion rather than a length, so a stretched ellipse stays an ellipse
 * through every resize without anything having to recompute it, and the band a
 * gradient outline is masked out of curves with it.
 */
export const ELLIPSE_RADIUS = '50%'
