/**
 * Thickness, colour and dash for an outline, shared by the shape and image
 * panels so the two read as one setting rather than two that happen to rhyme.
 *
 * Colour and dash only appear once there is a line to apply them to. A panel
 * that opens with three controls for something switched off is three controls
 * of noise on every shape anyone selects.
 */
import ColorSelect from './ColorSelect'
import NumberSlider from './NumberSlider'
import ValueSelect from './ValueSelect'
import './borderControls.less'

/** What the store holds, against what the list shows. */
const STYLES: Record<string, string> = { solid: 'Solid', dashed: 'Dashed', dotted: 'Dotted' }

type Props = {
  width?: number
  color?: string
  style?: string
  /** Design pixels. Past this an outline is filling the thing it outlines. */
  maxWidth?: number
  onChange: (key: 'borderWidth' | 'borderColor' | 'borderStyle', value: number | string) => void
}

export default function BorderControls({ width = 0, color = '#000000ff', style = 'solid', maxWidth = 40, onChange }: Props) {
  const thickness = Number(width) || 0
  const named = STYLES[style] || STYLES.solid

  return (
    <>
      <NumberSlider value={thickness} style={{ fontSize: 14 }} label="Thickness" maxValue={maxWidth} onChange={(value) => onChange('borderWidth', value)} />
      {thickness > 0 ? (
        <div className="border-controls">
          <ColorSelect label="Colour" value={color} modes={['Solid', 'Gradient']} onValueChange={(value) => onChange('borderColor', value)} />
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
        </div>
      ) : null}
    </>
  )
}
