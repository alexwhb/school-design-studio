import ShapeStyle from '../shape/ShapeStyle'

/** A box, with the one section an ellipse has no use for: its corners. */
export default function WRectStyle() {
  return <ShapeStyle corners />
}
