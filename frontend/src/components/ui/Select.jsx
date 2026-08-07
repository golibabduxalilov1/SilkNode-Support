import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

/** Native select styled to visually match text inputs, with a trailing chevron. */
const Select = forwardRef(function Select({ error, className = '', children, ...rest }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={error ? 'true' : undefined}
        className={[
          'min-h-11 w-full appearance-none rounded-sm border bg-panel px-3.5 pr-10 text-[15px] text-ink',
          'transition-[border-color,box-shadow] duration-150 ease-swiss',
          'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/[0.16]',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-sunken',
          error ? 'border-error focus:border-error focus:ring-error/[0.16]' : 'border-line-strong',
          className,
        ].join(' ')}
        {...rest}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden="true" />
    </div>
  );
});

export default Select;
