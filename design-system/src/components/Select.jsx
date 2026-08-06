import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../lib/cn.js';

/**
 * Select — native <select> restyled to match Input exactly, with a
 * lucide chevron. Native semantics keep keyboard/screen-reader behavior free.
 */
export const Select = forwardRef(function Select(
  { error = false, className, children, ...props },
  ref
) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(
          'w-full min-h-11 appearance-none rounded-sm border bg-white px-3.5 py-2.5 pr-10',
          'font-sans text-[15px] text-fg',
          'transition-colors duration-150 [transition-timing-function:var(--ease-swiss)]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-sunken',
          'outline-none',
          error
            ? 'border-error focus:border-error focus:[box-shadow:var(--error-ring)]'
            : 'border-border-strong focus:border-accent focus:[box-shadow:var(--focus-ring)]',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-fg-muted"
        aria-hidden="true"
      />
    </div>
  );
});
