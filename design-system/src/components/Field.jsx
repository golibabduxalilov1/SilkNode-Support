import { forwardRef, useId } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn.js';

const controlBase = cn(
  'w-full min-h-11 rounded-sm border bg-white px-3.5 py-2.5',
  'font-sans text-[15px] text-fg placeholder:text-fg-muted',
  'transition-colors duration-150 [transition-timing-function:var(--ease-swiss)]',
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-sunken'
);

function controlState(error) {
  return error
    ? 'border-error focus:border-error focus:[box-shadow:var(--error-ring)]'
    : 'border-border-strong focus:border-accent focus:[box-shadow:var(--focus-ring)]';
}

/** Text input matching the spec: 44px min height, 10px/14px padding, 4px radius. */
export const Input = forwardRef(function Input(
  { error = false, loading = false, className, ...props },
  ref
) {
  return (
    <div className="relative">
      <input
        ref={ref}
        aria-invalid={error || undefined}
        className={cn(controlBase, controlState(error), loading && 'pr-10', 'outline-none', className)}
        {...props}
      />
      {loading && (
        <Loader2
          className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-fg-muted"
          aria-hidden="true"
        />
      )}
    </div>
  );
});

/** Vertically resizable textarea, same visual language as Input. */
export const Textarea = forwardRef(function Textarea({ error = false, className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={error || undefined}
      className={cn(controlBase, controlState(error), 'min-h-24 resize-y outline-none', className)}
      {...props}
    />
  );
});

/**
 * Field — label + control + hint/error wrapper shared by every form control.
 * Renders the 11px uppercase monospace label the spec calls for, plus a
 * single line of assistive text beside the field (hint, or error on top).
 */
export function Field({
  label,
  required = false,
  optional = false,
  hint,
  error,
  htmlFor,
  className,
  children,
}) {
  const generatedId = useId();
  const id = htmlFor || generatedId;
  const messageId = `${id}-message`;

  const control =
    typeof children === 'function'
      ? children({ id, 'aria-describedby': hint || error ? messageId : undefined })
      : children;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-fg-secondary"
        >
          {label}
          {required && <span className="text-error">*</span>}
          {optional && <span className="normal-case text-fg-muted">(optional)</span>}
        </label>
      )}
      {control}
      {(hint || error) && (
        <p
          id={messageId}
          className={cn('text-[13px]', error ? 'text-error' : 'text-fg-muted')}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
