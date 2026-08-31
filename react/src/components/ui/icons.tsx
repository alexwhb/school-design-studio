type IconProps = { className?: string; width?: number | string; height?: number | string }

export function ArrowRightIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M340.864 149.312a30.592 30.592 0 0 0 0 42.752L652.736 512 340.864 831.872a30.592 30.592 0 0 0 0 42.752 29.12 29.12 0 0 0 41.728 0L714.24 534.336a32 32 0 0 0 0-44.672L382.592 149.376a29.12 29.12 0 0 0-41.728 0z"
      />
    </svg>
  )
}

export function CloseIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"
      />
    </svg>
  )
}

export function DeleteIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M160 256H96a32 32 0 0 1 0-64h256V95.936a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32V192h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32V256zm448-64v-64H416v64h192zM224 896h576V256H224v640zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32zm192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32z"
      />
    </svg>
  )
}

export function DownloadIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64zm384-253.696 236.288-236.352 45.248 45.248L508.8 704 192 387.2l45.248-45.248L480 584.704V128h64v450.304z"
      />
    </svg>
  )
}

export function ArrowUpIcon({ className, width = '1em', height = '1em' }: IconProps) {
  return (
    <svg className={className} width={width} height={height} viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <path
        fill="currentColor"
        d="m488.832 344.32-339.84 356.672a32 32 0 0 0 0 44.16l.384.384a29.44 29.44 0 0 0 42.688 0l320-335.872 319.872 335.872a29.44 29.44 0 0 0 42.688 0l.384-.384a32 32 0 0 0 0-44.16L535.168 344.32a32 32 0 0 0-46.336 0z"
      />
    </svg>
  )
}
