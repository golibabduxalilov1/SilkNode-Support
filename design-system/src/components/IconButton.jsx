import { forwardRef } from 'react';
import { cn } from '../lib/cn.js';

const VARIANTS = {
  solid: 'bg-dark text-white border border-dark hover:bg-dark-hover',
  accent: 'bg-accent text-white border border-accent hover:bg-accent-hover',
  outline: 'bg-transparent text-fg border border-border-strong hover:bg-veil',
  quiet: 'bg-transparent text-fg-secondary border border-transparent hover:bg-veil hover:text-fg',
  destructive: 'bg-transparent text-error border border-border-strong hover:bg-error/5 hover:border-error',
};

/** IconButton — always exactly 44×44px. Requires an accessible `label`. */
export const IconButton = forwardRef(function IconButton(
  { variant = 'outline', label, disabled = false, className, children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      className={cn(
        'inline-flex size-11 shrink-0 items-center justify-center rounded-sm',
        'transition-colors duration-150 [transition-timing-function:var(--ease-swiss)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        VARIANTS[variant],
        disabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
