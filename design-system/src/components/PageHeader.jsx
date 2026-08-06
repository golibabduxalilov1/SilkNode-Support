import { cn } from '../lib/cn.js';

/** PageHeader — top-of-page title block: eyebrow, display title, description, actions. */
export function PageHeader({ eyebrow, title, description, actions, className }) {
  return (
    <div className={cn('flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="flex flex-col gap-2">
        {eyebrow && (
          <span className="font-mono text-[11px] font-medium uppercase tracking-wider text-accent">{eyebrow}</span>
        )}
        <h1 className="font-display text-[28px] font-semibold tracking-[-0.03em] text-fg sm:text-[34px]">{title}</h1>
        {description && <p className="max-w-2xl text-[15px] text-fg-secondary">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </div>
  );
}
