/**
 * What the editor draws over the page while you work: the lines things snap to,
 * and the grid.
 *
 * These are settings for the editor rather than for the design — nothing here
 * comes out in an export — but the page is where anyone looks for them, so this
 * is where they are. Both are kept in `controlState` and remembered between
 * visits.
 */
import { useSnapshot } from 'valtio'
import { PanelSection } from '@/components/ui/PanelSection'
import { controlState } from '@/store/state'
import { setGridSize, setShowGrid, setSnapEnabled } from '@/store/control'
import NumberInput from '@/components/modules/settings/NumberInput'
import ToggleRow from '@/components/modules/settings/ToggleRow'
import './canvasSection.less'

/** Fine enough to line a caption up on, coarse enough to still be a grid. */
const MIN_GRID = 2
const MAX_GRID = 400

export default function CanvasSection() {
  const { dSnapEnabled, dShowGrid, dGridSize } = useSnapshot(controlState)

  return (
    <PanelSection title="Canvas" className="canvas-section">
      <ToggleRow label="Snap to objects" checked={dSnapEnabled} onCheckedChange={setSnapEnabled} />
      <ToggleRow label="Grid" checked={dShowGrid} onCheckedChange={setShowGrid}>
        {/* How fine the grid is only matters once there is one. */}
        {dShowGrid ? (
          <div className="canvas-section__grid">
            <NumberInput variant="underline" label="Size" value={dGridSize} suffix="px" minValue={MIN_GRID} maxValue={MAX_GRID} onChange={(value) => setGridSize(Number(value))} />
          </div>
        ) : null}
      </ToggleRow>
    </PanelSection>
  )
}
