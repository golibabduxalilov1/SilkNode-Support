import { cn } from '../lib/cn.js';

/** SectionHeader — smaller title used inside pages/panels, with an optional action. */
export function SectionHeader({ title, description, action, className }) {
  return (
    <div className={cn('flex items-center justify-between gap-4', className)}>
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-[17px] font-semibold tracking-[-0.02em] text-fg">{title}</h2>
        {description && <p className="text-[13px] text-fg-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
