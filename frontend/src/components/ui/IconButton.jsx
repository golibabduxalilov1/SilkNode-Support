import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  quiet:   'bg-transparent text-ink-soft border-transparent hover:bg-veil hover:text-ink',
  outline: 'bg-panel text-ink border-line-strong hover:bg-sunken hover:border-ink-faint',
  solid:   'bg-ink text-white border-transparent hover:bg-dark-hover',
  accent:  'bg-accent text-white border-transparent hover:bg-accent-hover',
};

/** Icon-only 44x44 touch target. Requires `label` for accessibility (aria-label). */
const IconButton = forwardRef(function IconButton(
  { icon: Icon, label, variant = 'quiet', size = 'md', loading = false, disabled = false, className = '', ...rest },
  ref
) {
  const dim = size === 'sm' ? 'w-9 h-9' : 'w-11 h-11';
  return (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center flex-none rounded-sm border',
        'transition-colors duration-150 ease-swiss',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        'focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        dim, VARIANTS[variant], className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 className="size-[18px] animate-spin" aria-hidden /> : Icon ? <Icon className="size-[18px]" aria-hidden /> : null}
    </button>
  );
});

export default IconButton;
