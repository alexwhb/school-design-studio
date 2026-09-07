import type React from 'react';
type IconProps = {
    className?: string;
    width?: number | string;
    height?: number | string;
    style?: React.CSSProperties;
    onClick?: React.MouseEventHandler<SVGSVGElement>;
};
export declare function ArrowRightIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function CloseIcon({ className, width, height, onClick }: IconProps): React.JSX.Element;
export declare function DeleteIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function DownloadIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function ArrowUpIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function CheckIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function UploadFilledIcon({ className, width, height, style }: IconProps): React.JSX.Element;
/** Three evenly spaced columns: the gaps are the point, so they are drawn equal. */
export declare function DistributeHorizontalIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The same three, stacked. */
export declare function DistributeVerticalIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function BulletListIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function NumberListIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function LinkedIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function UnlinkedIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The ring the ellipse tool draws, at the proportions its default one has. */
export declare function EllipseIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The box the rectangle tool draws, with the rounded corner it is known for. */
export declare function RectangleIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The triangle the polygon tool starts from, before its corners are turned up. */
export declare function PolygonIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The pen's nib, pointing down and to the left the way every pen tool's does. */
export declare function PenIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A painter's palette, for the Brand tab — after Lucide's, which the shapes library already draws from. */
export declare function BrandIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Two overlapping squares, the upper one solid: this layer over the rest. */
export declare function BringToFrontIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The same two, the lower one solid: this layer under the rest. */
export declare function SendToBackIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The line tool: a bare diagonal. The arrowhead is the Arrow tool beside it. */
export declare function LineIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function TableIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Points back towards the panel it belongs to: hides a left panel, reopens a right one. */
export declare function ChevronLeftIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The mirror of it: hides a right panel, reopens a left one. */
export declare function ChevronRightIcon({ className, width, height }: IconProps): React.JSX.Element;
/** An arrow curling back on itself, anticlockwise. */
export declare function UndoIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The same arrow the other way round. */
export declare function RedoIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A five-pointed star, outlined: apply the whole kit at once. */
export declare function StarIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A pencil lying on its side: edit this one row in place. */
export declare function PencilIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A plus, for the row or tile that adds one more of whatever is above it. */
export declare function PlusIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The glyph in a panel's search well. */
export declare function SearchIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Templates: a tall panel and two stacked ones — a page and its layouts. */
export declare function TemplatesIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Text: a serif capital T under its rule. */
export declare function TextIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Graphics: a circle and a square, which is what the library holds. */
export declare function GraphicsIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Photos: the frame, the sun and the hills. */
export declare function PhotosIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The pointer, which is what "no tool is armed" looks like. */
export declare function SelectToolIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A serif capital I under its bar: the text tool everywhere. */
export declare function TextToolIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Two shapes overlapping, for the button that opens the shape tools. */
export declare function ShapesIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A framed picture with a horizon in it. */
export declare function PictureIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Three finder squares and a scrap of data: a QR code at icon size. */
export declare function QrCodeIcon({ className, width, height }: IconProps): React.JSX.Element;
/** An arrow out of a tray: picking a file off this machine. */
export declare function UploadArrowIcon({ className, width, height }: IconProps): React.JSX.Element;
/** A chevron, pointing up: the caret on a dock button that opens a popover. */
export declare function ChevronUpIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function DuplicateIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function TrashIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function EyeIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function EyeOffIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function LockIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function UnlockIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function ChevronDownIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function PhotoIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function CornerRadiusIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function RotateIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function LetterSpacingIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function LineHeightIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function CropIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function ZoomIcon({ className, width, height }: IconProps): React.JSX.Element;
export declare function StraightenIcon({ className, width, height }: IconProps): React.JSX.Element;
/** The Arrow tool: the line tool armed carrying the Arrows row's `Arrow` preset. */
export declare function ArrowToolIcon({ className, width, height }: IconProps): React.JSX.Element;
/** AI: a four-pointed sparkle with a smaller one beside it. */
export declare function SparkleIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Add: both squares kept, as one outline. */
export declare function UnionIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Subtract: the top square taken out of the bottom one. */
export declare function SubtractIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Intersect: only the part both squares cover. */
export declare function IntersectIcon({ className, width, height }: IconProps): React.JSX.Element;
/** Exclude overlap: everything except the part both squares cover. */
export declare function ExcludeIcon({ className, width, height }: IconProps): React.JSX.Element;
export {};
