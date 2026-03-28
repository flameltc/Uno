import type { LucideIcon, LucideProps } from 'lucide-react'

import { cn } from '@renderer/lib/utils'

type AppIconSize = 'sm' | 'md' | 'lg'

const iconSizeClassMap: Record<AppIconSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-[18px] w-[18px]',
  lg: 'h-5 w-5'
}

export function AppIcon({
  icon: Icon,
  size = 'md',
  accent = false,
  className,
  strokeWidth = 1.85,
  ...props
}: Omit<LucideProps, 'size'> & {
  icon: LucideIcon
  size?: AppIconSize
  accent?: boolean
}) {
  return (
    <Icon
      aria-hidden="true"
      strokeWidth={strokeWidth}
      className={cn(iconSizeClassMap[size], accent ? 'text-accent' : 'text-fg-subtle', className)}
      {...props}
    />
  )
}
