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
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M556 108a48 48 0 0 1 68 0l292 292a48 48 0 0 1 0 68L620 772a48 48 0 0 1-24 13l-52 11-73 73a112 112 0 1 1-68-68l73-73 11-52a48 48 0 0 1 13-24zm34 102L494 306l224 224 96-96zM426 374l-46 214 214-46zM320 764a48 48 0 1 0 0 96 48 48 0 0 0 0-96z"
      />
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

/** The line tool: a diagonal with an arrowhead, which is what most lines end up with. */
export function LineIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M832 160a32 32 0 0 1 32 32v288a32 32 0 0 1-64 0V301L237 864a32 32 0 1 1-45-45l563-563H544a32 32 0 0 1 0-64z"
      />
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
