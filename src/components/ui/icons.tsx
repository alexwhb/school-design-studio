import type React from 'react'

type IconProps = {
  className?: string
  width?: number | string
  height?: number | string
  style?: React.CSSProperties
  onClick?: React.MouseEventHandler<SVGSVGElement>
}

export function ArrowRightIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M340.864 149.312a30.592 30.592 0 0 0 0 42.752L652.736 512 340.864 831.872a30.592 30.592 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z" />
    </svg>
  )
}

export function CloseIcon({ className, width = '1em', height = '1em', onClick }: IconProps) {
  return (
    <svg className={className} width={width} height={height} onClick={onClick} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z" />
    </svg>
  )
}

export function DeleteIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32V256zm448-64v-64H416v64h192zM224 896h576V256H224v640zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32zm192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32z" />
    </svg>
  )
}

export function DownloadIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64zm384-253.696 236.288-236.352 45.248 45.248L508.8 704 192 387.2l45.248-45.248L480 584.704V128h64v450.304z" />
    </svg>
  )
}

export function ArrowUpIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="m488.832 344.32-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872 319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z" />
    </svg>
  )
}

export function CheckIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M406.656 706.944 195.84 496.256a32 32 0 1 0-45.248 45.248l256 256 512-512a32 32 0 0 0-45.248-45.248L406.592 706.944z" />
    </svg>
  )
}

export function UploadFilledIcon({ className, width = '1em', height = '1em', style }: IconProps) {
  return (
    <svg className={className} width={width} height={height} style={style} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M544 864V672h128L512 480 352 672h128v192H320v-1.6c-5.376.32-10.496 1.6-16 1.6A240 240 0 0 1 64 624c0-123.136 93.12-223.488 212.608-237.248A239.808 239.808 0 0 1 512 192a239.872 239.872 0 0 1 235.456 194.752c119.488 13.76 212.48 114.112 212.48 237.248a240 240 0 0 1-240 240c-5.376 0-10.56-1.28-16-1.6v1.6z" />
    </svg>
  )
}

/** Three evenly spaced columns: the gaps are the point, so they are drawn equal. */
export function DistributeHorizontalIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M96 112h128v800H96zM448 336h128v352H448zM800 112h128v800H800z" />
    </svg>
  )
}

/** The same three, stacked. */
export function DistributeVerticalIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d="M112 96h800v128H112zM336 448h352v128H336zM112 800h800v128H112z" />
    </svg>
  )
}

/*
 * The editor's two icon fonts have no list icons, so the text panel's list
 * toggles are drawn here instead. Both sit on the same 1024 grid as the rest.
 */

/** The three lines of text, from `x` across to the right edge of the grid. */
const listRows = (x: number) => [208, 464, 720].map((y) => `M${x} ${y}h${928 - x}a48 48 0 0 1 0 96H${x}a48 48 0 0 1 0-96z`).join('')

export function BulletListIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d={listRows(384)} />
      <circle fill="currentColor" cx="152" cy="256" r="60" />
      <circle fill="currentColor" cx="152" cy="512" r="60" />
      <circle fill="currentColor" cx="152" cy="768" r="60" />
    </svg>
  )
}

export function NumberListIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      {/* The numerals are wider than the bullets, so the lines start further in. */}
      <path fill="currentColor" d={listRows(440)} />
      {['1', '2', '3'].map((digit, index) => (
        <text key={digit} x="160" y={256 + index * 256} fill="currentColor" fontSize="330" fontWeight="700" fontFamily="system-ui, -apple-system, sans-serif" textAnchor="middle" dominantBaseline="central">
          {digit}
        </text>
      ))}
    </svg>
  )
}

/**
 * The chain that holds a box's four corner radii together, and the same chain
 * broken. Drawn here rather than taken from either icon font, which have no
 * link icon between them.
 */
const linkHalves = 'M416 608a176 176 0 0 1 0-249l112-112a176 176 0 0 1 249 249l-56 56a48 48 0 0 1-68-68l56-56a80 80 0 0 0-113-113L484 427a80 80 0 0 0 0 113 48 48 0 0 1-68 68zM608 416a176 176 0 0 1 0 249L496 777a176 176 0 0 1-249-249l56-56a48 48 0 0 1 68 68l-56 56a80 80 0 0 0 113 113l112-112a80 80 0 0 0 0-113 48 48 0 0 1 68-68z'

export function LinkedIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d={linkHalves} />
    </svg>
  )
}

export function UnlinkedIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path fill="currentColor" d={linkHalves} />
      {/* The break: a stroke through the middle, cased so it reads on either half. */}
      <path fill="currentColor" d="M232 168a48 48 0 0 0-68 68l624 624a48 48 0 0 0 68-68z" />
    </svg>
  )
}

/** The ring the ellipse tool draws, at the proportions its default one has. */
export function EllipseIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M512 160a352 352 0 1 1 0 704 352 352 0 0 1 0-704zm0 64a288 288 0 1 0 0 576 288 288 0 0 0 0-576z"
      />
    </svg>
  )
}

/** The box the rectangle tool draws, with the rounded corner it is known for. */
export function RectangleIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M320 160h384a160 160 0 0 1 160 160v384a160 160 0 0 1-160 160H320a160 160 0 0 1-160-160V320a160 160 0 0 1 160-160zm0 64a96 96 0 0 0-96 96v384a96 96 0 0 0 96 96h384a96 96 0 0 0 96-96V320a96 96 0 0 0-96-96z"
      />
    </svg>
  )
}

/** The triangle the polygon tool starts from, before its corners are turned up. */
export function PolygonIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M512 128a64 64 0 0 1 55 31l360 608a64 64 0 0 1-55 97H152a64 64 0 0 1-55-97l360-608a64 64 0 0 1 55-31zm0 96L177 800h670z"
      />
    </svg>
  )
}

/** The pen's nib, pointing down and to the left the way every pen tool's does. */
export function PenIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M4 16c0-6 3-9 9-11-2 8-5 10-9 11z" />
      <path d="M4 16l3.2-3.2" />
    </svg>
  )
}

/** A painter's palette, for the Brand tab — after Lucide's, which the shapes library already draws from. */
export function BrandIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
      <circle cx="13.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r="1" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r="1" fill="currentColor" />
      <circle cx="6.5" cy="12" r="1" fill="currentColor" />
    </svg>
  )
}

/** Two overlapping squares, the upper one solid: this layer over the rest. */
export function BringToFrontIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M384 128h512v512H768v160H608v128H128V416h128V256h128zM224 512v320h288V512zM352 416h384V224H352z"
      />
    </svg>
  )
}

/** The same two, the lower one solid: this layer under the rest. */
export function SendToBackIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M128 416h512v512H128zM384 128h512v512H768V384H384zM224 512v320h320V512z"
      />
    </svg>
  )
}

/** The line tool: a bare diagonal. The arrowhead is the Arrow tool beside it. */
export function LineIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 18 20 6" />
    </svg>
  )
}


export function TableIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
      <path d="M3 9.5h18M3 14.75h18M9.5 9.5V20M15.5 9.5V20" />
    </svg>
  )
}

/** Points back towards the panel it belongs to: hides a left panel, reopens a right one. */
export function ChevronLeftIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 4.5 6.5 8 10 11.5" />
    </svg>
  )
}

/** The mirror of it: hides a right panel, reopens a left one. */
export function ChevronRightIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 4.5 9.5 8 6 11.5" />
    </svg>
  )
}

/** An arrow curling back on itself, anticlockwise. */
export function UndoIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 7h6.2a3.3 3.3 0 1 1 0 6.6H7" />
      <path d="M5.6 4.4 3 7l2.6 2.6" />
    </svg>
  )
}

/** The same arrow the other way round. */
export function RedoIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M13 7H6.8a3.3 3.3 0 1 0 0 6.6H9" />
      <path d="M10.4 4.4 13 7l-2.6 2.6" />
    </svg>
  )
}

/** A five-pointed star, outlined: apply the whole kit at once. */
export function StarIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 2.2 9.7 6l3.8.5-2.8 2.7.7 3.8L8 11.2l-3.4 1.8.7-3.8L2.5 6.5 6.3 6z" />
    </svg>
  )
}

/** A pencil lying on its side: edit this one row in place. */
export function PencilIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" aria-hidden="true">
      <path d="M10.5 2.8 13.2 5.5 6 12.7l-3.2.5.5-3.2z" />
    </svg>
  )
}

/** A plus, for the row or tile that adds one more of whatever is above it. */
export function PlusIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
      <path d="M8 3.5v9M3.5 8h9" />
    </svg>
  )
}

/** The glyph in a panel's search well. */
export function SearchIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="7" cy="7" r="4.3" />
      <path d="M10.3 10.3 13.5 13.5" strokeLinecap="round" />
    </svg>
  )
}

/** Templates: a tall panel and two stacked ones — a page and its layouts. */
export function TemplatesIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={1.5} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7" height="16" rx="1.6" />
      <rect x="12" y="3" width="7" height="7" rx="1.6" />
      <rect x="12" y="12" width="7" height="7" rx="1.6" />
    </svg>
  )
}

/** Text: a serif capital T under its rule. */
export function TextIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={1.5} xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6V4.5h14V6M11 4.5V18M8 18h6" />
    </svg>
  )
}

/** Graphics: a circle and a square, which is what the library holds. */
export function GraphicsIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={1.5} xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="4" />
      <rect x="11.5" y="11.5" width="7.5" height="7.5" rx="1.6" />
    </svg>
  )
}

/** Photos: the frame, the sun and the hills. */
export function PhotosIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth={1.5} xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4.5" width="16" height="13" rx="1.8" />
      <circle cx="8" cy="9" r="1.6" />
      <path d="M3.6 15 8.5 11l3.4 2.7 2.6-2 3.9 3.6" />
    </svg>
  )
}

/** The pointer, which is what "no tool is armed" looks like. */
export function SelectToolIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <path d="M5 3.5 15 10l-4.4 1.1L8.7 16z" />
    </svg>
  )
}

/** A serif capital I under its bar: the text tool everywhere. */
export function TextToolIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 6V4.5h12V6M10 4.5V16M7.5 16h5" />
    </svg>
  )
}

/** Two shapes overlapping, for the button that opens the shape tools. */
export function ShapesIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="9" height="9" rx="1.6" />
      <circle cx="13" cy="13" r="4" />
    </svg>
  )
}

/** A framed picture with a horizon in it. */
export function PictureIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="14" height="12" rx="1.8" />
      <circle cx="7.5" cy="8" r="1.4" />
      <path d="M3.6 14 8 10.4l3 2.4 2.3-1.8L17 14" />
    </svg>
  )
}

/** Three finder squares and a scrap of data: a QR code at icon size. */
export function QrCodeIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="3" width="5.5" height="5.5" rx="1" />
      <rect x="11.5" y="3" width="5.5" height="5.5" rx="1" />
      <rect x="3" y="11.5" width="5.5" height="5.5" rx="1" />
      <path d="M11.5 11.5h2.5v2.5h-2.5zM15.5 15.5H17V17h-1.5z" />
    </svg>
  )
}

/** An arrow out of a tray: picking a file off this machine. */
export function UploadArrowIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8 11.5V3.5M5 6.5 8 3.5l3 3M2.5 11v1.5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V11" />
    </svg>
  )
}

/** A chevron, pointing up: the caret on a dock button that opens a popover. */
export function ChevronUpIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 7.5 6 4l3.5 3.5" />
    </svg>
  )
}

export function DuplicateIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="2.5" y="2.5" width="7" height="7" rx="1.2" />
      <rect x="6.5" y="6.5" width="7" height="7" rx="1.2" />
    </svg>
  )
}

export function TrashIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 5.5h10M6 5.5V4h4v1.5M4.5 5.5l.6 7.2h5.8l.6-7.2" />
    </svg>
  )
}

export function EyeIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M1.8 8S4 4.5 8 4.5 14.2 8 14.2 8 12 11.5 8 11.5 1.8 8 1.8 8z" />
      <circle cx="8" cy="8" r="1.5" />
    </svg>
  )
}

export function EyeOffIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M1.8 8S4 4.5 8 4.5 14.2 8 14.2 8 12 11.5 8 11.5 1.8 8 1.8 8z" />
      <path d="M2.5 13.5 13.5 2.5" />
    </svg>
  )
}

export function LockIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.4" />
      <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7" />
    </svg>
  )
}

export function UnlockIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.4" />
      <path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.5-1.1" />
    </svg>
  )
}

export function ChevronDownIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  )
}

export function PhotoIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <rect x="2.5" y="3.5" width="11" height="9" rx="1.4" />
      <circle cx="6" cy="7" r="1" />
      <path d="M3 11.5 6.5 8.5l2.5 2 1.8-1.4 2.7 2.4" />
    </svg>
  )
}

export function CornerRadiusIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M3 13V6.5A3.5 3.5 0 0 1 6.5 3H13" />
    </svg>
  )
}

export function RotateIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8 3.2a4.8 4.8 0 1 1-4.6 3.4" />
      <path d="M3.2 3.4v3.2h3.2" />
    </svg>
  )
}

export function LetterSpacingIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 18 16" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
      <path d="M1 6.5 3.2 1.6 5.4 6.5M1.7 5h3M8.2 6.5l2.2-4.9 2.2 4.9M8.9 5h3M2 12.5h13M4 10.5l-2 2 2 2M13 10.5l2 2-2 2" />
    </svg>
  )
}

export function LineHeightIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M8 3.5h6M8 8h6M8 12.5h6M3.5 3v10M2 4.5 3.5 3 5 4.5M2 11.5 3.5 13 5 11.5" />
    </svg>
  )
}

export function CropIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M4.5 2v9.5H14M2 4.5h9.5V14" />
    </svg>
  )
}

export function ZoomIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <circle cx="8" cy="8" r="5" />
      <path d="M8 5.5v5M5.5 8h5" />
    </svg>
  )
}

export function StraightenIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
      <path d="M2.5 12.5 13 5M2.5 12.5h11" />
    </svg>
  )
}

/** The Arrow tool: the line tool armed carrying the Arrows row's `Arrow` preset. */
export function ArrowToolIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 12h14M14 7l5 5-5 5" />
    </svg>
  )
}
