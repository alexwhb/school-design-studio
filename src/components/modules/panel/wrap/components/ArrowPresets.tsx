/**
 * The Arrows row of the Graphics panel: the ready-made lines, each drawn as a
 * small picture of itself.
 *
 * The pictures are the real thing — `PathPaint` given the preset at thumbnail
 * size — so a preset looks in the panel exactly as it will on the page, and a
 * change to how a head is drawn changes both. The stroke is thickened for the
 * thumbnail so a two-pixel line reads at sixty pixels wide.
 *
 * Clicking one arms the line tool carrying it rather than dropping a line in
 * the middle of the page: an arrow is a thing you draw between two points, and
 * one that lands ready-made has to be moved and resized before it points at
 * anything. The armed tile stays lit while the pointer is away on the page,
 * which is the same thing the dock's own tools do.
 */
import { useSnapshot } from 'valtio'
import PathPaint from '@/components/modules/widgets/wPath/PathPaint'
import { LINE_PRESETS, linePresetSetting, type TLinePreset } from '@/components/modules/widgets/wPath/linePresets'
import { controlState } from '@/store/state'
import { toggleLinePreset } from '@/store/control'
import { cx } from '@/utils/dom'
import PanelEyebrow from './PanelEyebrow'
import { PanelSectionBlock } from './PanelShell'
import './arrowPresets.less'

const THUMB = { width: 72, height: 28 }

/** The preset drawn to fit a thumbnail, in the panel's own ink. */
function thumbnail(preset: TLinePreset) {
  const setting = linePresetSetting(preset, { width: THUMB.width, height: THUMB.height })
  return { ...setting, borderWidth: 3, borderColor: 'currentColor' }
}

export default function ArrowPresets() {
  const { dDrawTool, dLinePreset } = useSnapshot(controlState)

  return (
    <PanelSectionBlock className="arrow-presets">
      <PanelEyebrow label="Arrows" />
      <div className="arrow-presets__list">
        {LINE_PRESETS.map((preset) => (
          <button
            key={preset.name}
            type="button"
            className={cx('arrow-presets__item', { 'is-armed': dDrawTool === 'line' && dLinePreset === preset.name })}
            title={preset.name}
            aria-pressed={dDrawTool === 'line' && dLinePreset === preset.name}
            onClick={() => toggleLinePreset(preset.name)}
          >
            <PathPaint params={thumbnail(preset)} />
          </button>
        ))}
      </div>
    </PanelSectionBlock>
  )
}
