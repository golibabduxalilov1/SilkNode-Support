/** Helpful placeholder for empty lists/tables. Pass `icon`, `action` (a Button) as needed. */
export default function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center gap-3 px-5 py-12 text-center ${className}`}>
      {Icon && <Icon className="size-8 text-ink-faint" aria-hidden="true" strokeWidth={1.5} />}
      {title && <h3 className="font-display text-base font-semibold tracking-tight text-ink">{title}</h3>}
      {description && <p className="max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
