import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium',
  {
    variants: {
      variant: {
        neutral: 'border-border-default bg-canvas-default text-fg-muted',
        accent: 'border-[#b6e3ff] bg-accent-subtle text-accent',
        success: 'border-[#9be9a8] bg-success-subtle text-success',
        warning: 'border-[#d4a72c] bg-warning-subtle text-warning',
        danger: 'border-[#ff8182] bg-danger-subtle text-danger'
      }
    },
    defaultVariants: {
      variant: 'neutral'
    }
  }
)

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}
