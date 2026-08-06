import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../lib/cn.js';

const VARIANTS = {
  solid:
    'bg-dark text-white border border-dark hover:bg-dark-hover active:bg-dark-hover',
  accent:
    'bg-accent text-white border border-accent hover:bg-accent-hover active:bg-accent-dark',
  outline:
    'bg-transparent text-fg border border-border-strong hover:bg-veil active:bg-border',
  quiet:
    'bg-transparent text-fg-secondary border border-transparent hover:bg-veil hover:text-fg',
  destructive:
    'bg-transparent text-error border border-border-strong hover:bg-error/5 hover:border-error active:bg-error/10',
};

const SIZES = {
  default: 'h-11 px-5 text-sm gap-2',
  lg: 'h-13 px-7 text-sm gap-2',
};

/**
 * Button — the system's single button primitive.
 * variant: solid | accent | outline | quiet | destructive
 * size: default (44px) | lg (52px CTA)
 */
export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'solid',
    size = 'default',
    loading = false,
    disabled = false,
    className,
    children,
    ...props
  },
  ref
) {
  const isDisabled = disabled || loading;

  return (
    <Component
      ref={ref}
      disabled={Component === 'button' ? isDisabled : undefined}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap',
        'font-medium font-sans rounded-sm',
        'transition-colors duration-150 [transition-timing-function:var(--ease-swiss)]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        size === 'lg' ? SIZES.lg : SIZES.default,
        VARIANTS[variant],
        isDisabled && 'opacity-40 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Component>
  );
});
