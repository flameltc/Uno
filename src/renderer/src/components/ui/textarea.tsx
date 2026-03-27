import * as React from 'react'

import { cn } from '@renderer/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-md border border-border-default bg-canvas-card px-3 py-2 text-sm text-fg-default shadow-sm outline-none transition-colors placeholder:text-fg-subtle focus:border-accent focus:ring-2 focus:ring-accent/20',
        className
      )}
      {...props}
    />
  )
)

Textarea.displayName = 'Textarea'

export { Textarea }
