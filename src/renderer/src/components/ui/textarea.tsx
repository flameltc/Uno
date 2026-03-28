import * as React from 'react'

import { cn } from '@renderer/lib/utils'

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-24 w-full rounded-[18px] border border-white/10 bg-black/20 px-4 py-3 text-sm text-fg-default shadow-panel backdrop-blur-xl outline-none transition-all duration-200 placeholder:text-fg-subtle focus:border-accent/40 focus:bg-black/35 focus:ring-2 focus:ring-accent/15',
        className
      )}
      {...props}
    />
  )
)

Textarea.displayName = 'Textarea'

export { Textarea }
