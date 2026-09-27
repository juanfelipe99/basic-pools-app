import add from '@material-symbols/svg-300/outlined/add.svg?raw'
import arrowForward from '@material-symbols/svg-300/outlined/arrow_forward.svg?raw'
import check from '@material-symbols/svg-300/outlined/check.svg?raw'
import close from '@material-symbols/svg-300/outlined/close.svg?raw'
import cloudOff from '@material-symbols/svg-300/outlined/cloud_off.svg?raw'
import contentCopy from '@material-symbols/svg-300/outlined/content_copy.svg?raw'
import deleteIcon from '@material-symbols/svg-300/outlined/delete.svg?raw'
import error from '@material-symbols/svg-300/outlined/error.svg?raw'
import info from '@material-symbols/svg-300/outlined/info.svg?raw'
import key from '@material-symbols/svg-300/outlined/key.svg?raw'
import lock from '@material-symbols/svg-300/outlined/lock.svg?raw'
import lockOpen from '@material-symbols/svg-300/outlined/lock_open.svg?raw'
import remove from '@material-symbols/svg-300/outlined/remove.svg?raw'
import searchOff from '@material-symbols/svg-300/outlined/search_off.svg?raw'

const icons = {
  add,
  arrow_forward: arrowForward,
  check,
  close,
  cloud_off: cloudOff,
  content_copy: contentCopy,
  delete: deleteIcon,
  error,
  info,
  key,
  lock,
  lock_open: lockOpen,
  remove,
  search_off: searchOff,
}

export type IconName = keyof typeof icons

// The source SVGs have a fixed 48px size; drop it so the icon follows font-size
const markup = Object.fromEntries(
  Object.entries(icons).map(([name, svg]) => [
    name,
    svg.replace(/\s(width|height)="\d+"/g, '').replace('<svg', '<svg fill="currentColor"'),
  ]),
) as Record<IconName, string>

interface IconProps {
  name: IconName
  size?: number
  className?: string
}

export function Icon({ name, size, className }: IconProps) {
  return (
    <span
      className={className ? `icon ${className}` : 'icon'}
      style={size ? { fontSize: size } : undefined}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: markup[name] }}
    />
  )
}
