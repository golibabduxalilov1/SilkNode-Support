import { cn } from '../lib/cn.js';

const VARIANTS = {
  neutral: 'bg-veil text-fg-secondary border-border-strong',
  accent: 'bg-accent-tint text-accent-dark border-accent/20',
  positive: 'bg-success/10 text-success border-success/20',
  caution: 'bg-warning/10 text-warning border-warning/20',
  critical: 'bg-error/10 text-error border-error/20',
  informative: 'bg-info/10 text-info border-info/20',
};

/**
 * StatusTag — compact, near-square badge for status/metadata. Semantic
 * variants communicate state only; use `neutral`/`accent` for non-status labels.
 */
export function StatusTag({ variant = 'neutral', dot = false, className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-1',
        'font-mono text-[11px] font-medium uppercase tracking-wide leading-none',
        VARIANTS[variant],
        className
      )}
    >
      {dot && <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  );
}
