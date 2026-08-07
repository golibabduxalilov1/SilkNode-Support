import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  solid:   'bg-ink text-white border-transparent hover:bg-dark-hover',
  accent:  'bg-accent text-white border-transparent hover:bg-accent-hover',
  outline: 'bg-panel text-ink border-line-strong hover:bg-sunken hover:border-ink-faint',
  quiet:   'bg-transparent text-ink-soft border-transparent hover:bg-veil hover:text-ink',
  danger:  'bg-error text-white border-transparent hover:bg-red-700',
};

const SIZES = {
  sm: 'min-h-9 px-3.5 text-[13px] gap-1.5',
  md: 'min-h-11 px-5 text-sm gap-2',
  lg: 'min-h-13 px-7 text-[15px] gap-2.5',
};

/**
 * Primary button primitive. Variants: solid (black), accent (indigo, default),
 * outline, quiet, danger. Sizes: sm, md (default), lg. Pass `as="a"` to render
 * a link styled as a button (e.g. an external "open in Telegram" CTA).
 */
const Button = forwardRef(function Button(
  { as: As = 'button', variant = 'accent', size = 'md', fullWidth = false, loading = false, disabled = false,
    iconLeft: IconLeft, iconRight: IconRight, className = '', children, ...rest },
  ref
) {
  const isDisabled = disabled || loading;
  return (
    <As
      ref={ref}
      type={As === 'button' ? 'button' : undefined}
      disabled={As === 'button' ? isDisabled : undefined}
      aria-disabled={As !== 'button' && isDisabled ? 'true' : undefined}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center rounded-sm border font-medium',
        'transition-colors duration-150 ease-swiss',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        As !== 'button' && isDisabled ? 'pointer-events-none opacity-40' : '',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        VARIANTS[variant], SIZES[size],
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : IconLeft ? <IconLeft className="size-4" aria-hidden /> : null}
      {children}
      {!loading && IconRight ? <IconRight className="size-4" aria-hidden /> : null}
    </As>
  );
});

export default Button;
