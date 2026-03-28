import * as React from 'react'

import { cn } from '@renderer/lib/utils'

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-11 w-full rounded-[18px] border border-white/10 bg-black/20 px-4 text-sm text-fg-default shadow-panel backdrop-blur-xl outline-none transition-all duration-200 placeholder:text-fg-subtle focus:border-accent/40 focus:bg-black/35 focus:ring-2 focus:ring-accent/15 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  )
)

Input.displayName = 'Input'

export { Input }
