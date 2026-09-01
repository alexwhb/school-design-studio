/**
 * A number that changes once the page's typefaces have arrived.
 *
 * An arc is measured before it is drawn — see arcLayout.ts — and a character
 * measured in the fallback font is the wrong width, so anything laid out from
 * those numbers has to be laid out again in the font that turned up. Straight
 * text needs none of this: the browser lays it out again itself.
 */
import { useEffect, useState } from 'react'

export default function useFontTick(reloadOn?: unknown): number {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    if (!document.fonts) return
    let alive = true
    const bump = () => alive && setTick((value) => value + 1)
    document.fonts.ready.then(bump)
    // `ready` settles once; a font asked for later — a second widget's, or one
    // a template brings with it — arrives as this.
    document.fonts.addEventListener?.('loadingdone', bump)
    return () => {
      alive = false
      document.fonts.removeEventListener?.('loadingdone', bump)
    }
  }, [reloadOn])

  return tick
}
