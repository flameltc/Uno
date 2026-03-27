import * as React from 'react'

import { cn } from '@renderer/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-md border border-border-default bg-canvas-card px-3 text-sm text-fg-default shadow-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-canvas-default',
        className
      )}
      {...props}
    />
  )
)

Input.displayName = 'Input'

export { Input }
