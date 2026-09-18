/**
 * The outline round a shape or a photograph: whether there is one, what colour
 * it is, how thick, and whether it is dashed.
 *
 * The row is the switch — a check, the colour, the word, and the pencil that
 * opens the picker — and the numbers follow it. Colour and dash used to appear
 * only once there was a line to apply them to, which meant the panel changed
 * shape as you dragged the thickness past zero.
 */
import { useRef } from 'react'
import ColorSelect from './ColorSelect'
import NumberSlider from './NumberSlider'
import ValueSelect from './ValueSelect'
import './borderControls.less'

/** What the store holds, against what the list shows. */
const STYLES: Record<string, string> = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted' }

/** Thin enough to read as a keyline, which is what an outline switched on should be. */
const DEFAULT_WIDTH = 2

type Props = {
  width?: number
  color?: string
  style?: string
  /** Design pixels. Past this an outline is filling the thing it outlines. */
  maxWidth?: number
  label?: string
  onChange: (key: 'borderWidth' | 'borderColor' | 'borderStyle', value: number | string) => void
}

export default function BorderControls({ width = 0, color = '#000000ff', style = 'solid', maxWidth = 40, label = 'Border', onChange }: Props) {
  const thickness = Number(width) || 0
  const named = STYLES[style] || STYLES.solid
  // Switching an outline off takes it off the design entirely, so the thickness
  // that was dialled in lives here until it is switched back on — the same
  // bargain ShadowSelect strikes, and for the same reason.
  const remembered = useRef(DEFAULT_WIDTH)

  function toggle(on: boolean) {
    if (!on) {
      if (thickness > 0) remembered.current = thickness
      onChange('borderWidth', 0)
      return
    }
    onChange('borderWidth', remembered.current || DEFAULT_WIDTH)
  }

  return (
    <div className="border-controls">
      <ColorSelect variant="row" label={label} value={color} enabled={thickness > 0} onEnabledChange={toggle} modes={['Solid', 'Gradient']} onValueChange={(value) => onChange('borderColor', value)} />
      <div className="border-controls__fields">
        <NumberSlider value={thickness} label="Thickness" maxValue={maxWidth} onChange={(value) => onChange('borderWidth', value)} />
        {thickness > 0 ? (
          <ValueSelect
            label="Style"
            readonly
            inputWidth="100%"
            value={named}
            data={Object.values(STYLES)}
            onFinish={(value) => {
              const key = Object.keys(STYLES).find((name) => STYLES[name] === value)
              if (key) onChange('borderStyle', key)
            }}
          />
        ) : null}
      </div>
    </div>
  )
}
