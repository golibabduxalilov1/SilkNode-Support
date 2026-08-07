const VARIANTS = {
  neutral:     'bg-veil text-ink-soft',
  accent:      'bg-accent-tint text-accent-dark',
  positive:    'bg-success-tint text-success',
  caution:     'bg-warning-tint text-warning',
  critical:    'bg-error-tint text-error',
  informative: 'bg-info-tint text-info',
};

const DOTS = {
  neutral: 'bg-ink-faint', accent: 'bg-accent', positive: 'bg-success',
  caution: 'bg-warning', critical: 'bg-error', informative: 'bg-info',
};

/** Compact, almost-square status badge. Variants communicate meaning, never decoration. */
export default function StatusTag({ variant = 'neutral', dot = true, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-[2px] px-1.5 py-1 font-mono text-[11px] font-medium uppercase tracking-wide ${VARIANTS[variant]} ${className}`}>
      {dot && <span className={`size-1.5 flex-none rounded-full ${DOTS[variant]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}
