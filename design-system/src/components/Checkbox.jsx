import { forwardRef, useId } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../lib/cn.js';

/** Checkbox — 20×20px, nearly square, indigo fill when checked. */
export const Checkbox = forwardRef(function Checkbox(
  { label, disabled = false, className, id, ...props },
  ref
) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        'inline-flex items-center gap-2.5 select-none',
        disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer',
        className
      )}
    >
      <span className="relative inline-flex size-5 shrink-0">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          disabled={disabled}
          className="peer absolute inset-0 size-5 cursor-pointer appearance-none rounded-[3px] border border-border-strong bg-white transition-colors duration-150 checked:border-accent checked:bg-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed"
          {...props}
        />
        <Check
          className="pointer-events-none absolute inset-0 size-5 scale-75 p-[3px] text-white opacity-0 transition-all duration-150 peer-checked:scale-100 peer-checked:opacity-100"
          strokeWidth={3}
          aria-hidden="true"
        />
      </span>
      {label && <span className="text-[15px] text-fg">{label}</span>}
    </label>
  );
});
