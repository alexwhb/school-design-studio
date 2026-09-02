/**
 * The Arrows row of the Elements panel: the ready-made lines, each drawn as a
 * small picture of itself.
 *
 * The pictures are the real thing — `PathPaint` given the preset at thumbnail
 * size — so a preset looks in the panel exactly as it will on the page, and a
 * change to how a head is drawn changes both. The stroke is thickened for the
 * thumbnail so a two-pixel line reads at sixty pixels wide.
 */
import { recordHistory } from '@/common/hooks/history'
import PathPaint from '@/components/modules/widgets/wPath/PathPaint'
import { LINE_PRESETS, linePresetSetting, type TLinePreset } from '@/components/modules/widgets/wPath/linePresets'
import { canvasState } from '@/store/state'
import { setShowMoveable } from '@/store/control'
import { addWidget } from '@/store/widget'
import './arrowPresets.less'

const THUMB = { width: 72, height: 28 }

/** The preset drawn to fit a thumbnail, in the panel's own ink. */
function thumbnail(preset: TLinePreset) {
  const setting = linePresetSetting(preset, { width: THUMB.width, height: THUMB.height })
  return { ...setting, borderWidth: 3, borderColor: 'currentColor' }
}

export default function ArrowPresets() {
  function add(preset: TLinePreset) {
    setShowMoveable(false)
    // A click, so the undo stack's own listeners see it; recorded by hand all
    // the same, because every other way a line gets onto the page is.
    recordHistory(() => addWidget(linePresetSetting(preset, canvasState.dPage)))
  }

  return (
    <div className="arrow-presets">
      <div className="types__header arrow-presets__header">
        <span style={{ flex: 1 }}>Arrows</span>
      </div>
      <div className="arrow-presets__list">
        {LINE_PRESETS.map((preset) => (
          <button key={preset.name} type="button" className="arrow-presets__item" title={preset.name} onClick={() => add(preset)}>
            <PathPaint params={thumbnail(preset)} />
          </button>
        ))}
      </div>
    </div>
  )
}
