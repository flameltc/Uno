import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md border text-sm font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60',
  {
    variants: {
      variant: {
        default: 'border-accent bg-accent text-fg-onEmphasis hover:bg-[#0860ca]',
        secondary: 'border-border-default bg-canvas-card text-fg-default hover:bg-canvas-default',
        outline: 'border-border-default bg-canvas-card text-fg-default hover:bg-canvas-default',
        ghost: 'border-transparent bg-transparent text-fg-muted hover:border-border-default hover:bg-canvas-default hover:text-fg-default',
        danger: 'border-danger bg-danger text-fg-onEmphasis hover:bg-[#b62324]'
      },
      size: {
        sm: 'h-8 px-3',
        md: 'h-9 px-3.5',
        lg: 'h-10 px-4'
      }
    },
    defaultVariants: {
      variant: 'secondary',
      size: 'md'
    }
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      ref={ref}
      {...props}
    />
  )
)

Button.displayName = 'Button'

export { Button, buttonVariants }
