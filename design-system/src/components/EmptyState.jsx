import { Inbox } from 'lucide-react';
import { cn } from '../lib/cn.js';

/** EmptyState — icon + message for empty lists, tables, and search results. */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  compact = false,
  className,
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'gap-2 py-10' : 'gap-3 py-16',
        className
      )}
    >
      <Icon className={cn('text-fg-muted', compact ? 'size-6' : 'size-8')} strokeWidth={1.5} aria-hidden="true" />
      <div className="flex flex-col gap-1">
        <p className={cn('font-medium text-fg', compact ? 'text-[14px]' : 'text-[15px]')}>{title}</p>
        {description && <p className="max-w-sm text-[13px] text-fg-muted">{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
