/**
 * Where a thing is and how big it is: four numbers, two to a row, with the key
 * in mono beside each one.
 *
 * Every element's panel opened with the same four boxed fields under a "Size
 * and position" heading, each carrying its axis inside its own border. That is
 * a lot of chrome for four numbers nobody types into most of the time, so the
 * boxes are gone and what is left is the rule the number sits on.
 */
import NumberInput from './NumberInput'
import './transformGrid.less'

type Props = {
  active: Record<string, any>
  onChange: (key: string, value: number | string) => void
  /** Width and height cannot go to nothing on a shape; a text box sizes itself. */
  minSize?: number
  /** Turned artwork also wants its angle here rather than only on the canvas. */
  rotation?: boolean
}

export default function TransformGrid({ active, onChange, minSize, rotation }: Props) {
  const angle = Math.round(parseFloat(String(active.rotate ?? 0)) || 0)

  return (
    <div className="transform-grid">
      <NumberInput variant="underline" label="X" value={Math.round(active.left)} onChange={(v) => onChange('left', Number(v))} />
      <NumberInput variant="underline" label="Y" value={Math.round(active.top)} onChange={(v) => onChange('top', Number(v))} />
      <NumberInput variant="underline" label="W" value={Math.round(active.width)} minValue={minSize} onChange={(v) => onChange('width', Number(v))} />
      <NumberInput variant="underline" label="H" value={Math.round(active.height)} minValue={minSize} onChange={(v) => onChange('height', Number(v))} />
      {rotation ? (
        <NumberInput variant="underline" label="R" suffix="°" value={angle} onChange={(v) => onChange('rotate', String(Number(v) || 0))} />
      ) : null}
    </div>
  )
}
