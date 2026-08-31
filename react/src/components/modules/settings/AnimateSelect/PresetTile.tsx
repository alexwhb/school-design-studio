import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef } from 'react'
import { cancelAll, playPreset } from '@/common/animations/play'
import type { AnimationPreset } from '@/common/animations/presets'
import { cx } from '@/utils/dom'

export type PresetTileHandle = {
  play: () => void
}

type Props = {
  preset: AnimationPreset
  selected?: boolean
  onChoose: (id: string) => void
}

/**
 * A long preset is cut short here. `drift` runs for nearly two seconds, which is
 * right on a slide and far too slow to sit through fifteen times in a picker.
 */
const TILE_MAX_MS = 900

const PresetTile = forwardRef<PresetTileHandle, Props>(function PresetTile({ preset, selected, onChoose }, ref) {
  const mockRef = useRef<HTMLSpanElement | null>(null)
  const running = useRef<Animation[]>([])

  const play = useCallback(() => {
    if (!mockRef.current) return
    cancelAll(running.current)
    running.current = playPreset(mockRef.current, preset, { duration: Math.min(preset.duration, TILE_MAX_MS) })
  }, [preset])

  useImperativeHandle(ref, () => ({ play }), [play])

  useEffect(() => () => cancelAll(running.current), [])

  return (
    <button
      type="button"
      className={cx('tile', { 'tile--on': !!selected })}
      onMouseEnter={play}
      onFocus={play}
      onClick={() => onChoose(preset.id)}
    >
      <span className="tile__stage">
        <span ref={mockRef} className="tile__mock">
          <span className="tile__bar" />
          <span className="tile__line" />
          <span className="tile__line tile__line--short" />
        </span>
      </span>
      <span className="tile__name">{preset.name}</span>
    </button>
  )
})

export default PresetTile
