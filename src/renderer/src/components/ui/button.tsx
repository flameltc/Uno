import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@renderer/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-[16px] border px-4 text-sm font-semibold tracking-[0.01em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-45',
  {
    variants: {
      variant: {
        default:
          'border-accent/25 bg-[linear-gradient(135deg,#adc6ff_0%,#4b8eff_100%)] text-accent-foreground shadow-[0_18px_40px_rgba(75,142,255,0.32)] hover:brightness-110 hover:shadow-[0_18px_52px_rgba(75,142,255,0.42)]',
        secondary:
          'border-white/10 bg-white/[0.06] text-fg-default shadow-panel backdrop-blur-xl hover:border-accent/20 hover:bg-white/[0.09]',
        outline:
          'border-white/10 bg-black/20 text-fg-default shadow-panel backdrop-blur-xl hover:border-accent/20 hover:bg-white/[0.05]',
        ghost:
          'border-transparent bg-transparent text-fg-muted hover:border-white/10 hover:bg-white/[0.04] hover:text-fg-default',
        danger:
          'border-danger/30 bg-[linear-gradient(135deg,#fb7185_0%,#ef4444_100%)] text-white shadow-[0_18px_42px_rgba(239,68,68,0.24)] hover:brightness-110'
      },
      size: {
        sm: 'h-9 px-3.5',
        md: 'h-10 px-4',
        lg: 'h-11 px-5'
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
    <button className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />
  )
)

Button.displayName = 'Button'

export { Button, buttonVariants }
