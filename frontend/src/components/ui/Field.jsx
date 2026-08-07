import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

/** Labeled form-field wrapper: label, required/optional marker, hint, and error message. */
export function Field({ label, htmlFor, required, optional, hint, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="flex items-center gap-1.5 font-mono text-[11px] font-medium uppercase tracking-wider text-ink-soft"
        >
          {label}
          {required && <span className="text-error normal-case tracking-normal" aria-hidden="true">*</span>}
          {optional && <span className="font-sans lowercase tracking-normal text-ink-faint">optional</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-faint">{hint}</p>}
      {error && <p role="alert" className="text-[12.5px] font-medium text-error">{error}</p>}
    </div>
  );
}

const fieldControlClasses = (error, sizing, className) => [
  'w-full rounded-sm border bg-panel px-3.5 text-[15px] text-ink placeholder:text-ink-faint',
  'transition-[border-color,box-shadow] duration-150 ease-swiss',
  'focus:outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/[0.16]',
  'disabled:opacity-40 disabled:cursor-not-allowed disabled:bg-sunken',
  error ? 'border-error focus:border-error focus:ring-error/[0.16]' : 'border-line-strong',
  sizing,
  className,
].join(' ');

export const Input = forwardRef(function Input({ error, loading, className = '', wrapperClassName = '', ...rest }, ref) {
  const input = (
    <input
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      className={fieldControlClasses(error, 'min-h-11', className)}
      {...rest}
    />
  );
  if (!loading) return wrapperClassName ? <div className={wrapperClassName}>{input}</div> : input;
  return (
    <div className={`relative ${wrapperClassName}`}>
      {input}
      <Loader2 className="absolute right-3.5 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-faint" aria-hidden="true" />
    </div>
  );
});

export const TextArea = forwardRef(function TextArea({ error, className = '', ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={error ? 'true' : undefined}
      className={fieldControlClasses(error, 'min-h-27.5 resize-y py-2.5', className)}
      {...rest}
    />
  );
});

export default Field;
